import { addMonthsMinusOneDay } from './cycleJar';
import { isoDateKey } from './dailyLog';
import { computeCycleCloseBalance } from './cyclePace';
import { validateCycleStartDate } from './cycleEdit';

/**
 * Latest confirmed log date for a cycle (ignores closedAt on the cycle record).
 * @param {import('./schema').BudgetCycle} cycle
 * @param {import('./schema').DailyLog[]} logs
 * @returns {string|null}
 */
export function lastConfirmedLogDateInCycle(cycle, logs) {
  if (!cycle?.startedAt) return null;
  let max = null;
  for (const entry of logs || []) {
    if (entry.cycleId !== cycle.id) continue;
    if (entry.status !== 'confirmed') continue;
    if (entry.date < cycle.startedAt) continue;
    if (!max || entry.date > max) max = entry.date;
  }
  return max;
}

/**
 * Default close date for a backfill cycle — nominal pay-period end, or last log if earlier.
 * @param {import('./schema').BudgetCycle} cycle
 * @param {import('./schema').DailyLog[]} logs
 * @param {string} [todayIso]
 * @returns {string}
 */
export function resolveDefaultCycleCloseDate(cycle, logs, todayIso = isoDateKey()) {
  const nominal = addMonthsMinusOneDay(cycle.startedAt);
  const lastLog = lastConfirmedLogDateInCycle(cycle, logs);
  let candidate = nominal;
  if (lastLog && lastLog < nominal) {
    candidate = lastLog;
  }
  if (candidate > todayIso) candidate = todayIso;
  if (candidate < cycle.startedAt) candidate = cycle.startedAt;
  return candidate;
}

/**
 * @param {import('./schema').BudgetCycle|null|undefined} cycle
 * @param {string} [todayIso]
 */
export function isBackfillCycle(cycle, todayIso = isoDateKey()) {
  return Boolean(cycle?.startedAt && cycle.startedAt < todayIso);
}

/**
 * @param {string|null|undefined} startedAt
 * @param {string|null|undefined} closedAt
 * @param {string} [todayIso]
 * @returns {'validationEndDate'|'validationEndBeforeStart'|'validationEndFuture'|null}
 */
export function validateCycleEndDate(startedAt, closedAt, todayIso = isoDateKey()) {
  if (!closedAt) return 'validationEndDate';
  if (!startedAt || closedAt < startedAt) return 'validationEndBeforeStart';
  if (closedAt > todayIso) return 'validationEndFuture';
  return null;
}

/**
 * @param {string|null|undefined} startedAt
 * @param {string|null|undefined} closedAt
 * @param {string} [todayIso]
 * @returns {string|null} validation key
 */
export function validateCycleDateRange(startedAt, closedAt, todayIso = isoDateKey()) {
  const startErr = validateCycleStartDate(startedAt, todayIso);
  if (startErr) return startErr;
  if (closedAt) {
    const endErr = validateCycleEndDate(startedAt, closedAt, todayIso);
    if (endErr) return endErr;
  }
  return null;
}

/**
 * Recompute spent / surplus / deficit for a closed cycle at given bounds.
 * @param {import('./schema').BudgetCycle} cycle
 * @param {import('./schema').DailyLog[]} logs
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {string} closedAt
 * @param {import('./schema').CycleAdjustment[]} [cycleAdjustments]
 */
export function recomputeClosedCycleTotals(cycle, logs, budget, closedAt, cycleAdjustments = []) {
  const balance = computeCycleCloseBalance(
    { ...cycle, closedAt: null },
    logs,
    budget || {},
    closedAt,
    cycleAdjustments,
  );
  return {
    spentTotal: balance.spentTotal,
    surplus: balance.surplus,
    deficit: balance.deficit,
    pool: balance.pool,
  };
}
