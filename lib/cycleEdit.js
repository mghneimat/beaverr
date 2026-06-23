import { setData } from './storage';
import { updateBudgetCycle, getActiveCycle, loadCycleStore } from './budgetCycle';
import { isoDateKey, previousDay } from './dailyLog';

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
