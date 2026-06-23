import { roundMoney } from '../finance';

/**
 * @param {number} startingPrincipal
 * @param {number} currentBalance
 * @returns {number}
 */
export function computePaidDown(startingPrincipal, currentBalance) {
  const start = Math.max(0, Number(startingPrincipal) || 0);
  const balance = Math.max(0, Number(currentBalance) || 0);
  return roundMoney(Math.max(0, start - balance));
}

/**
 * @param {number} currentAmount
 * @param {number} targetAmount
 * @returns {number} 0–100
 */
export function computeSavingsProgressPercent(currentAmount, targetAmount) {
  const target = Number(targetAmount) || 0;
  if (target <= 0) return 0;
  const current = Math.max(0, Number(currentAmount) || 0);
  return Math.min(100, roundMoney((current / target) * 100));
}

/**
 * @param {import('../schema').Goal} goal
 * @param {number} [debtBalance]
 * @returns {number} 0–100
 */
export function computeProgressPercent(goal, debtBalance) {
  if (goal.type === 'reduceCosts') return 0;

  if (goal.type === 'debt') {
    const start = Number(goal.startingPrincipal) || Number(goal.targetAmount) || 0;
    if (start <= 0) return 0;
    const balance = debtBalance != null
      ? Number(debtBalance)
      : start - (Number(goal.currentAmount) || 0);
    return computeSavingsProgressPercent(computePaidDown(start, balance), start);
  }

  return computeSavingsProgressPercent(goal.currentAmount, goal.targetAmount);
}

/**
 * Amount that can still be funded before the goal reaches its target.
 * @param {import('../schema').Goal} goal
 * @param {number} [debtBalance]
 * @returns {number|null} null when there is no target cap
 */
export function computeRemainingToTarget(goal, debtBalance) {
  if (goal.type === 'reduceCosts') return 0;

  if (goal.type === 'debt') {
    const start = Number(goal.startingPrincipal) || Number(goal.targetAmount) || 0;
    if (start <= 0) return null;
    if (debtBalance != null) {
      return roundMoney(Math.max(0, Number(debtBalance) || 0));
    }
    const current = Math.max(0, Number(goal.currentAmount) || 0);
    return roundMoney(Math.max(0, start - current));
  }

  const target = Number(goal.targetAmount) || 0;
  if (target <= 0) return null;
  const current = Math.max(0, Number(goal.currentAmount) || 0);
  return roundMoney(Math.max(0, target - current));
}

/**
 * @param {import('../schema').Goal} goal
 * @param {number} [debtBalance]
 * @returns {boolean}
 */
export function isGoalComplete(goal, debtBalance) {
  if (goal.type === 'reduceCosts') return false;

  if (goal.type === 'debt') {
    const balance = debtBalance != null
      ? Number(debtBalance)
      : (Number(goal.startingPrincipal) || 0) - (Number(goal.currentAmount) || 0);
    return balance <= 0;
  }

  const target = Number(goal.targetAmount) || 0;
  if (target <= 0) return false;
  return (Number(goal.currentAmount) || 0) >= target;
}

/**
 * @param {import('../schema').Goal} goal
 * @param {number} newBalance
 * @param {number} [previousBalance]
 * @returns {import('../schema').Goal}
 */
export function recalculateDebtGoalFromBalance(goal, newBalance, previousBalance) {
  const start = Number(goal.startingPrincipal) || Number(goal.targetAmount) || 0;
  const paidDown = computePaidDown(start, newBalance);
  const prev = previousBalance != null ? Number(previousBalance) : goal.previousDebtBalance;
  const regressed = prev != null && Number(newBalance) > Number(prev);

  return {
    ...goal,
    currentAmount: paidDown,
    previousDebtBalance: Number(newBalance),
    paceStatus: regressed ? 'regressed' : goal.paceStatus,
  };
}

/**
 * Sync debt goal currentAmount from linked debt balance.
 * @param {import('../schema').Goal} goal
 * @param {import('../schema').DebtEntry|undefined} debt
 * @returns {import('../schema').Goal}
 */
export function syncDebtGoalProgress(goal, debt) {
  if (goal.type !== 'debt' || !debt) return goal;
  const balance = Number(debt.balance) || 0;
  const previous = goal.previousDebtBalance != null
    ? goal.previousDebtBalance
    : balance;
  return recalculateDebtGoalFromBalance(goal, balance, previous);
}
