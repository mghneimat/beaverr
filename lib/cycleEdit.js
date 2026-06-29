import { setData } from './storage';
import { updateBudgetCycle, getActiveCycle, loadCycleStore } from './budgetCycle';
import { isoDateKey, previousDay } from './dailyLog';
import {
  recomputeClosedCycleTotals,
  validateCycleDateRange,
} from './cycleCloseDates';

/**
 * @param {string|null} startedAt - YYYY-MM-DD
 * @param {string} [todayIso]
 * @returns {'validationDate'|'validationFuture'|null}
 */
export function validateCycleStartDate(startedAt, todayIso = isoDateKey()) {
  if (!startedAt) return 'validationDate';
  if (startedAt > todayIso) return 'validationFuture';
  return null;
}

/**
 * Update the start date of the active pay cycle and sync budget.lastClosedDay.
 * @param {{
 *   cycleId: string,
 *   startedAt: string,
 *   budget: import('./schema').Budget,
 * }} params
 * @returns {Promise<import('./schema').BudgetCycle>}
 */
export async function updateActiveCycleStartDate({ cycleId, startedAt, budget }) {
  const store = await loadCycleStore();
  const cycle = getActiveCycle(store);
  if (!cycle || cycle.id !== cycleId) {
    throw new Error('Active cycle not found');
  }

  const validationKey = validateCycleStartDate(startedAt);
  if (validationKey) {
    const err = new Error(validationKey);
    throw err;
  }

  if (cycle.startedAt === startedAt) {
    return cycle;
  }

  const updated = await updateBudgetCycle(cycleId, { startedAt });
  if (!updated) {
    throw new Error('Active cycle not found');
  }

  const dayBeforeStart = previousDay(startedAt);
  const lastClosedDay = budget.lastClosedDay && budget.lastClosedDay < startedAt
    ? budget.lastClosedDay
    : dayBeforeStart;

  await setData('beaverr_budget', {
    ...budget,
    lastClosedDay,
  });

  return updated;
}

/**
 * Update start/end dates on a closed cycle and recompute spent / surplus / deficit.
 * @param {{
 *   cycleId: string,
 *   startedAt: string,
 *   closedAt: string,
 *   dailyLogs: import('./schema').DailyLog[],
 *   budget: import('./schema').Budget,
 *   cycleAdjustments?: import('./schema').CycleAdjustment[],
 * }} params
 * @returns {Promise<import('./schema').BudgetCycle>}
 */
export async function updateClosedCycleDates({
  cycleId,
  startedAt,
  closedAt,
  dailyLogs,
  budget,
  cycleAdjustments = [],
}) {
  const store = await loadCycleStore();
  const cycle = store.cycles.find((c) => c.id === cycleId && c.status === 'closed');
  if (!cycle) {
    throw new Error('Closed cycle not found');
  }

  const validationKey = validateCycleDateRange(startedAt, closedAt);
  if (validationKey) {
    throw new Error(validationKey);
  }

  if (cycle.startedAt === startedAt && cycle.closedAt === closedAt) {
    return cycle;
  }

  const totals = recomputeClosedCycleTotals(
    { ...cycle, startedAt },
    dailyLogs,
    budget,
    closedAt,
    cycleAdjustments,
  );

  /** @type {Partial<import('./schema').BudgetCycle>} */
  const patch = {
    startedAt,
    closedAt,
    spentTotal: totals.spentTotal,
    surplus: totals.surplus,
    deficit: totals.deficit,
  };

  if (totals.surplus > 0 && cycle.surplusRouting) {
    patch.surplusRouting = { ...cycle.surplusRouting, amount: totals.surplus };
  }

  const updated = await updateBudgetCycle(cycleId, patch);
  if (!updated) {
    throw new Error('Closed cycle not found');
  }

  return updated;
}
