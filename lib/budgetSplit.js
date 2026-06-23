/**
 * Split flexible budget between spending and voluntary monthly savings.
 */

import { roundMoney } from './finance';

/**
 * @param {number|null|undefined} ratio
 * @returns {number} 0–1
 */
export function clampBudgetSpendingRatio(ratio) {
  const n = Number(ratio);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {number} totalAvailable
 * @param {number} rawSpending
 * @returns {number}
 */
export function snapSpendingMonthly(totalAvailable, rawSpending) {
  const base = Math.max(0, roundMoney(Number(totalAvailable) || 0));
  const clamped = Math.max(0, Math.min(base, roundMoney(Number(rawSpending) || 0)));
  return clamped;
}

/**
 * @param {number} totalAvailable
 * @param {number|null|undefined} ratio
 * @returns {number}
 */
export function ratioToSnappedSpending(totalAvailable, ratio) {
  const base = Math.max(0, Number(totalAvailable) || 0);
  if (base <= 0) return 0;
  return snapSpendingMonthly(base, base * clampBudgetSpendingRatio(ratio));
}

/**
 * @param {number} monthlyFlexible - Available flexible budget before split
 * @param {number|null|undefined} ratio - Share kept for spending (1 = all spending)
 * @returns {{ spendingMonthly: number, savingsShift: number, ratio: number }}
 */
export function splitFlexibleBudget(monthlyFlexible, ratio) {
  const base = Math.max(0, Number(monthlyFlexible) || 0);
  const spendingMonthly = ratioToSnappedSpending(base, ratio);
  const savingsShift = Math.max(0, base - spendingMonthly);
  const resolvedRatio = base > 0 ? spendingMonthly / base : 1;
  return { spendingMonthly, savingsShift, ratio: resolvedRatio };
}

/**
 * @param {number} totalAvailable
 * @param {number} spendingMonthly
 * @returns {number}
 */
export function clampSplitSpending(totalAvailable, spendingMonthly) {
  return snapSpendingMonthly(totalAvailable, spendingMonthly);
}

/**
 * @param {number} totalAvailable
 * @param {number} spendingMonthly
 * @returns {{ spendingMonthly: number, savingsShift: number, ratio: number }}
 */
export function splitFromSpendingAmount(totalAvailable, spendingMonthly) {
  const base = Math.max(0, Number(totalAvailable) || 0);
  const spending = clampSplitSpending(base, spendingMonthly);
  const savingsShift = Math.max(0, base - spending);
  const ratio = base > 0 ? spending / base : 1;
  return { spendingMonthly: spending, savingsShift, ratio };
}

/**
 * Resolve spending ratio from saved budget (ratio field or legacy monthlyFlexible / avail).
 * @param {{ budgetSpendingRatio?: number, monthlyFlexible?: number }|null|undefined} budget
 * @param {number} availableBudget
 * @returns {number}
 */
export function resolveBudgetSpendingRatio(budget, availableBudget) {
  if (budget?.budgetSpendingRatio != null) {
    return clampBudgetSpendingRatio(budget.budgetSpendingRatio);
  }
  const avail = Number(availableBudget) || 0;
  const saved = budget?.monthlyFlexible;
  if (saved != null && avail > 0) {
    return clampBudgetSpendingRatio(Number(saved) / avail);
  }
  return 1;
}
