import { setData } from './storage';
import { loadCycleStore, startBudgetCycle, getLastClosedCycle } from './budgetCycle';
import {
  consumeNextCycleAdjustments,
  loadCycleAdjustments,
  sumNextCycleAdjustments,
} from './cycleAdjustments';
import { previousDay } from './dailyLog';
import { roundMoney } from './finance';

/**
 * Enable pay cycles and create the first active cycle.
 * @param {{
 *   startedAt: string,
 *   budgetAmount: number,
 *   plannedSavingsAmount?: number,
 *   budget: import('./schema').Budget,
 * }} params
 */
export async function enableCyclesAndStart({
  startedAt,
  budgetAmount,
  plannedSavingsAmount = 0,
  budget,
}) {
  const store = await loadCycleStore();
  const lastClosed = getLastClosedCycle(store);
  let resolvedBudget = roundMoney(Number(budgetAmount) || 0);

  if (lastClosed) {
    const adjustments = await loadCycleAdjustments();
    const delta = sumNextCycleAdjustments(adjustments, lastClosed.id);
    resolvedBudget = Math.max(
      0,
      roundMoney(resolvedBudget + delta.income - delta.expense),
    );
    await consumeNextCycleAdjustments(lastClosed.id);
  }

  const cycle = await startBudgetCycle({
    startedAt,
    budgetAmount: resolvedBudget,
    plannedSavingsAmount,
  });

  const dayBeforeStart = previousDay(startedAt);
  const prunedHistory = (Array.isArray(budget?.dayEndHistory) ? budget.dayEndHistory : [])
    .filter((entry) => entry.date < startedAt);
  await setData('beaverr_budget', {
    ...budget,
    cyclesEnabled: true,
    activeCycleId: cycle.id,
    jarredThisMonth: 0,
    dayEndHistory: prunedHistory,
    lastClosedDay: dayBeforeStart,
  });

  return cycle;
}

/**
 * Sync denormalized activeCycleId on budget from cycle store.
 * @param {import('./schema').Budget} budget
 * @param {string|null} storeActiveId
 */
export async function syncBudgetActiveCycleId(budget, storeActiveId) {
  if (budget.activeCycleId === storeActiveId) return budget;
  const next = { ...budget, activeCycleId: storeActiveId };
  await setData('beaverr_budget', next);
  return next;
}
