import { parseAlertDate } from './alerts';
import {
  getMonthlySavingsReservation,
  hasTargetSavingsGoal,
  hasOngoingSavingsGoal,
} from './incomeGoals';
import { normalizeResetDestination } from './monthEndRouting';
import { getTotalStashBalance } from './jarRouting';

/**
 * @param {Date} target
 * @param {Date} [from=new Date()]
 * @returns {number}
 */
export function monthsUntilDate(target, from = new Date()) {
  if (!target || target <= from) return 0;
  const months =
    (target.getFullYear() - from.getFullYear()) * 12
    + (target.getMonth() - from.getMonth());
  return Math.max(1, months);
}

/**
 * Planned monthly savings from budget split and optional goal reservation.
 * @param {import('./householdBudget').HouseholdFinancials & { deductSavingsGoal?: boolean, savingsGoalDeduction?: number, budgetSavingsShift?: number }} financials
 * @param {{ monthlyRequired?: number }|null} [goalGap]
 * @returns {number}
 */
export function getMonthlyPlannedSavings(financials, goalGap) {
  const shift = Number(financials.budgetSavingsShift) || 0;
  const goalReserve = financials.deductSavingsGoal
    ? getMonthlySavingsReservation(financials.income, goalGap)
    : 0;
  const ongoing = hasOngoingSavingsGoal(financials.income)
    && !financials.deductSavingsGoal
    ? Number(financials.income?.savingsMonthlyTarget) || 0
    : 0;
  return shift + goalReserve + ongoing;
}

/**
 * @param {import('./householdBudget').HouseholdFinancials} financials
 * @param {{ monthlyRequired?: number }|null} [goalGap]
 * @returns {{ key: string, amount: number }[]}
 */
export function getSavingsInflowBreakdown(financials, goalGap) {
  const rows = [];
  const shift = Number(financials.budgetSavingsShift) || 0;
  if (shift > 0) {
    rows.push({ key: 'budgetShift', amount: shift });
  }
  if (financials.deductSavingsGoal) {
    const goalReserve = getMonthlySavingsReservation(financials.income, goalGap);
    if (goalReserve > 0) {
      rows.push({ key: 'goalReserve', amount: goalReserve });
    }
  } else if (hasOngoingSavingsGoal(financials.income)) {
    const ongoing = Number(financials.income?.savingsMonthlyTarget) || 0;
    if (ongoing > 0) {
      rows.push({ key: 'ongoingGoal', amount: ongoing });
    }
  }
  const budget = financials.budget || {};
  if (budget.rolloverStrategy === 'reset') {
    const dest = normalizeResetDestination(budget.resetUnspentDestination);
    if (dest === 'savings') {
      rows.push({ key: 'resetPolicy', amount: 0 });
    } else if (dest === 'looseMoney') {
      rows.push({ key: 'resetLoose', amount: 0 });
    }
  }
  return rows;
}

/**
 * @param {{
 *   financials: import('./householdBudget').HouseholdFinancials,
 *   goalGap?: { monthlyRequired?: number }|null,
 *   monthsAhead?: number,
 *   now?: Date,
 * }} params
 */
export function buildSavingsProjection({
  financials,
  goalGap = null,
  monthsAhead = 12,
  now = new Date(),
}) {
  const income = financials.income || {};
  const start = Number(income.savingsBalance) || 0;
  const monthlyInflow = getMonthlyPlannedSavings(financials, goalGap);
  const target = hasTargetSavingsGoal(income) ? Number(income.goalAmount) || 0 : null;
  const goalDate = parseAlertDate(income.goalDate);

  let horizon = monthsAhead;
  if (goalDate && goalDate > now) {
    horizon = Math.min(monthsAhead, monthsUntilDate(goalDate, now));
  }

  const points = [{ monthIndex: 0, balance: start, atGoal: start >= (target || Infinity) }];
  let balance = start;
  let reachedGoal = points[0].atGoal;

  for (let i = 1; i <= horizon; i += 1) {
    if (!reachedGoal) {
      balance += monthlyInflow;
    }
    if (target && balance >= target) {
      balance = target;
      reachedGoal = true;
    }
    points.push({ monthIndex: i, balance, atGoal: reachedGoal });
  }

  return {
    startBalance: start,
    monthlyInflow,
    goalAmount: target,
    goalDate: income.goalDate || null,
    monthsToGoal: goalDate && goalDate > now ? monthsUntilDate(goalDate, now) : null,
    points,
  };
}

/**
 * @param {import('./householdBudget').HouseholdFinancials} financials
 * @param {{ monthlyRequired?: number }|null} [_goalGap]
 * @returns {number}
 */
export function getTotalSavingsBalance(financials, _goalGap) {
  return getTotalStashBalance(financials.budget, financials.income);
}
