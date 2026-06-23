import { parseStoredDate } from '../datePicker';
import { toMonthly } from '../finance';
import { computeProgressPercent } from './goalProgress';

/**
 * True when the goal has a target date for progress tracking.
 * @param {import('../schema').Goal} goal
 * @returns {boolean}
 */
export function goalHasDeadline(goal) {
  if (goal.type === 'reduceCosts') return false;
  return Boolean(goal.endDate?.trim());
}

/**
 * @deprecated Use !goalHasDeadline(goal) for UI; pace returns null without a deadline.
 * @param {import('../schema').Goal} goal
 * @returns {boolean}
 */
export function goalMissingDeadline(goal) {
  if (goal.type === 'reduceCosts') return false;
  if (goal.lifecycleStatus === 'completed' || goal.lifecycleStatus === 'archived') {
    return false;
  }
  return !goalHasDeadline(goal);
}
/**
 * @param {string|null|undefined} endDate - DD/MM/YYYY or MM/YYYY
 * @param {Date} [now]
 * @returns {number|null}
 */
export function monthsUntilEndDate(endDate, now = new Date()) {
  if (!endDate) return null;
  const parts = endDate.split('/');
  const hasDay = parts.length === 3;
  const { day, month, year } = parseStoredDate(endDate, hasDay);
  if (!month || !year) return null;
  const target = new Date(year, month - 1, day || 1);
  const months = (target.getFullYear() - now.getFullYear()) * 12
    + (target.getMonth() - now.getMonth());
  return Math.max(1, months);
}

/**
 * @param {import('../schema').Goal} goal
 * @returns {number}
 */
export function sumActiveFundingMonthly(goal) {
  if (goal.lifecycleStatus !== 'active') return 0;
  return (goal.fundingRules || []).reduce((sum, rule) => {
    const amt = Number(rule.amount) || 0;
    if (amt <= 0 || rule.frequency === 'once') return sum;
    return sum + toMonthly(amt, rule.frequency);  }, 0);
}

/**
 * @param {import('../schema').Goal} goal
 * @param {number} [debtBalance]
 * @param {Date} [now]
 * @returns {import('../schema').GoalPaceStatus|null}
 */
export function computeGoalPaceStatus(goal, debtBalance, now = new Date()) {
  if (goal.paceStatus === 'regressed') return 'regressed';
  if (goal.type === 'reduceCosts') return 'on_track';
  if (!goalHasDeadline(goal)) return null;

  const progress = computeProgressPercent(goal, debtBalance);
  if (progress >= 100) return 'on_track';

  const target = goal.type === 'debt'
    ? (Number(goal.startingPrincipal) || Number(goal.targetAmount) || 0)
    : (Number(goal.targetAmount) || 0);
  const current = goal.type === 'debt'
    ? (Number(goal.currentAmount) || 0)
    : (Number(goal.currentAmount) || 0);
  const remaining = Math.max(0, target - current);

  const months = monthsUntilEndDate(goal.endDate, now);
  if (!months || remaining <= 0) return 'on_track';

  const requiredMonthly = remaining / months;
  const plannedMonthly = sumActiveFundingMonthly(goal);

  if (plannedMonthly <= 0) return 'behind';
  if (plannedMonthly >= requiredMonthly * 1.1) return 'ahead';
  if (plannedMonthly < requiredMonthly * 0.95) return 'behind';
  return 'on_track';
}

/**
 * @param {import('../schema').Goal} goal
 * @param {number} [debtBalance]
 * @param {Date} [now]
 * @returns {import('../schema').Goal}
 */
export function applyGoalPace(goal, debtBalance, now = new Date()) {
  if (goal.lifecycleStatus !== 'active') {
    return { ...goal, paceStatus: goal.paceStatus ?? null };
  }
  const paceStatus = computeGoalPaceStatus(goal, debtBalance, now);
  return {
    ...goal,
    paceStatus: paceStatus === null
      ? null
      : goal.paceStatus === 'regressed' && paceStatus === 'on_track'
        ? 'regressed'
        : paceStatus,
  };
}
