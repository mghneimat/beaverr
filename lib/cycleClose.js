import { setData } from './storage';
import { closeBudgetCycle, loadCycleStore, getActiveCycle } from './budgetCycle';
import { applyCoverageBalances, sumCoverage } from './overspendCoverage';
import { createObligation } from './obligations';
import { computeCycleCloseBalance } from './cyclePace';
import { consumeNextCycleAdjustments } from './cycleAdjustments';
import { roundMoney } from './finance';

/**
 * Close the active cycle, apply coverage, and optional obligations.
 * Pass nextCycle only when the caller should auto-start the following cycle.
 * @param {{
 *   cycleId: string,
 *   closedAt: string,
 *   dailyLogs: import('./schema').DailyLog[],
 *   budget: import('./schema').Budget,
 *   income: import('./schema').Income|null|undefined,
 *   coverage?: import('./schema').OverspendCoverage[],
 *   surplusRouting?: import('./schema').BudgetCycle['surplusRouting'],
 *   nextCycle?: { startedAt: string, budgetAmount: number, plannedSavingsAmount?: number },
 *   closedWithUnsetDays?: boolean,
 *   cycleAdjustments?: import('./schema').CycleAdjustment[],
 * }} params
 */
export async function finalizeCycleClose({
  cycleId,
  closedAt,
  dailyLogs,
  budget,
  income,
  coverage,
  surplusRouting,
  nextCycle,
  closedWithUnsetDays = false,
  cycleAdjustments = [],
}) {
  const store = await loadCycleStore();
  const cycle = store.cycles.find((c) => c.id === cycleId && c.status === 'active');
  if (!cycle) throw new Error('Active cycle not found');

  const closeBalance = computeCycleCloseBalance(
    cycle,
    dailyLogs,
    budget,
    closedAt,
    cycleAdjustments,
  );
  const spentTotal = closeBalance.spentTotal;
  const effectivePool = closeBalance.pool;
  const deficit = closeBalance.deficit;
  const surplus = closeBalance.surplus;

  const nextCycleDelta = nextCycle
    ? await consumeNextCycleAdjustments(cycleId)
    : { income: 0, expense: 0 };
  const adjustedNextCycle = nextCycle
    ? {
        ...nextCycle,
        budgetAmount: Math.max(
          0,
          roundMoney(
            nextCycle.budgetAmount + nextCycleDelta.income - nextCycleDelta.expense,
          ),
        ),
      }
    : undefined;

  const nextBudget = { ...budget };
  const nextIncome = income ? { ...income } : income;

  if (deficit > 0 && coverage?.length) {
    if (sumCoverage(coverage) < deficit) {
      throw new Error('Coverage does not cover deficit');
    }
    applyCoverageBalances({
      coverage,
      budget: nextBudget,
      income: nextIncome,
      cyclePlannedSavings: cycle.plannedSavingsAmount,
    });

    for (const row of coverage) {
      if (row.source === 'external' && row.trackObligation && row.amount > 0) {
        const obligation = await createObligation({
          amount: row.amount,
          source: row.externalType || 'other',
          note: row.note,
          fromCycleId: cycleId,
        });
        row.obligationId = obligation.id;
      }
    }
  }

  const { closed, next } = await closeBudgetCycle({
    cycleId,
    closedAt,
    spentTotal,
    spentAgainstPool: closeBalance.spentAgainstPool,
    surplusRouting,
    coverage: deficit > 0 ? coverage : undefined,
    nextCycle: adjustedNextCycle,
    closedWithUnsetDays,
    budgetBasis: effectivePool,
  });

  await setData('beaverr_budget', {
    ...nextBudget,
    activeCycleId: next?.id ?? null,
    ...(next ? { jarredThisMonth: 0 } : {}),
  });
  if (nextIncome) {
    await setData('beaverr_income', nextIncome);
  }

  return { closed, next, nextCycleDelta, surplus };
}

/**
 * @param {import('./schema').BudgetCycleStore|null|undefined} store
 * @returns {boolean}
 */
export function hasActiveCycle(store) {
  return Boolean(store && getActiveCycle(store));
}
