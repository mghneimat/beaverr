import { getActiveCycle, getClosedCycles } from './budgetCycle';

/**
 * @param {import('./schema').BudgetCycle} cycle
 * @returns {'asPlanned'|'saved'|'deficit'}
 */
export function classifyClosedCycle(cycle) {
  const surplus = Math.max(0, Number(cycle.surplus) || 0);
  const deficit = Math.max(0, Number(cycle.deficit) || 0);
  if (deficit > 0) return 'deficit';
  if (surplus > 0) return 'saved';
  return 'asPlanned';
}

/**
 * @param {import('./schema').BudgetCycleStore|null|undefined} cycleStore
 */
export function computeSummaryCycleOverview(cycleStore) {
  const closed = getClosedCycles(cycleStore || { cycles: [], activeCycleId: null });
  const active = getActiveCycle(cycleStore || { cycles: [], activeCycleId: null });

  return {
    elapsedCycles: closed.length + (active ? 1 : 0),
    closedCount: closed.length,
    hasActiveCycle: Boolean(active),
    activeCycle: active,
    closedCycles: closed,
  };
}

/**
 * Count how closed cycles ended — on plan, with savings, or in deficit.
 * Active cycle counts toward total but not toward outcome buckets until closed.
 * @param {import('./schema').BudgetCycleStore|null|undefined} cycleStore
 */
export function computeSummaryCycleCounts(cycleStore) {
  const store = cycleStore || { cycles: [], activeCycleId: null };
  const closed = getClosedCycles(store);
  const active = getActiveCycle(store);

  let asPlanned = 0;
  let savedMoney = 0;
  let deficit = 0;

  closed.forEach((cycle) => {
    const kind = classifyClosedCycle(cycle);
    if (kind === 'deficit') deficit += 1;
    else if (kind === 'saved') savedMoney += 1;
    else asPlanned += 1;
  });

  const inProgress = active ? 1 : 0;
  const total = closed.length + inProgress;

  return {
    total,
    closedCount: closed.length,
    inProgress,
    asPlanned,
    savedMoney,
    deficit,
  };
}

/**
 * @param {import('./schema').BudgetCycle} cycle
 */
export function formatCycleHistoryRow(cycle) {
  const spent = Math.max(0, Number(cycle.spentTotal) || 0);
  const budget = Math.max(0, Number(cycle.budgetAmount) || 0);
  const surplus = Math.max(0, Number(cycle.surplus) || 0);
  const deficit = Math.max(0, Number(cycle.deficit) || 0);

  return {
    id: cycle.id,
    startedAt: cycle.startedAt,
    closedAt: cycle.closedAt,
    budget,
    spent,
    surplus,
    deficit,
    net: surplus > 0 ? surplus : deficit > 0 ? -deficit : 0,
  };
}

/**
 * @param {import('./schema').BudgetCycleStore|null|undefined} cycleStore
 * @returns {ReturnType<typeof formatCycleHistoryRow>[]}
 */
export function buildSummaryCycleHistoryRows(cycleStore) {
  return getClosedCycles(cycleStore || { cycles: [], activeCycleId: null })
    .map(formatCycleHistoryRow);
}
