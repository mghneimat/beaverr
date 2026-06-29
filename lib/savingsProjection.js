import { parseAlertDate } from './alerts';
import { getCustomStashes } from './customStashes';
import { roundMoney } from './finance';
import {
  getMonthlySavingsReservation,
  hasTargetSavingsGoal,
  hasOngoingSavingsGoal,
} from './incomeGoals';
import { getTotalStashBalance } from './jarRouting';
import { normalizeResetDestination } from './monthEndRouting';
import { getStashMovements } from './stashMovements';

/**
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {import('./schema').Income|null|undefined} income
 * @returns {number}
 */
export function resolveSavingsStartBalance(budget, income) {
  if (budget) {
    return getTotalStashBalance(budget, income);
  }
  return Number(income?.savingsBalance) || 0;
}

/**
 * @param {string} stashRef
 * @param {import('./schema').Budget|null|undefined} budget
 * @returns {boolean}
 */
function isSavingsTabStashRef(stashRef, budget) {
  if (stashRef === 'looseCash' || stashRef === 'savings') return true;
  if (typeof stashRef === 'string' && stashRef.startsWith('stash:')) {
    const id = stashRef.slice('stash:'.length);
    return getCustomStashes(budget).some((stash) => stash.id === id);
  }
  return false;
}

/**
 * @param {Date} date
 * @returns {string}
 */
function monthKeyFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

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
  return rows;
}

/**
 * Whether month-end rollover can add variable savings (reset → savings).
 * Shown as an info banner on Savings, not as a table row — details live on Budget tab.
 * @param {import('./schema').Budget|null|undefined} budget
 * @returns {boolean}
 */
export function hasSavingsMonthEndRolloverHint(budget) {
  if (!budget || budget.rolloverStrategy !== 'reset') return false;
  return normalizeResetDestination(budget.resetUnspentDestination) === 'savings';
}

/**
 * @param {{
 *   financials: import('./householdBudget').HouseholdFinancials,
 *   goalGap?: { monthlyRequired?: number }|null,
 *   monthsAhead?: number,
 *   now?: Date,
 *   ignoreGoals?: boolean,
 * }} params
 */
export function buildSavingsProjection({
  financials,
  goalGap = null,
  monthsAhead = 12,
  now = new Date(),
  ignoreGoals = false,
}) {
  const income = financials.income || {};
  const budget = financials.budget;
  const start = resolveSavingsStartBalance(budget, income);
  const monthlyInflow = getMonthlyPlannedSavings(financials, goalGap);
  const target = !ignoreGoals && hasTargetSavingsGoal(income)
    ? Number(income.goalAmount) || 0
    : null;
  const goalDate = parseAlertDate(income.goalDate);

  let horizon = monthsAhead;
  if (!ignoreGoals && goalDate && goalDate > now) {
    horizon = Math.min(monthsAhead, monthsUntilDate(goalDate, now));
  }

  const points = [{ monthIndex: 0, balance: start, atGoal: !ignoreGoals && start >= (target || Infinity) }];
  let balance = start;
  let reachedGoal = points[0].atGoal;
  let goalReachedMonthIndex = reachedGoal ? 0 : null;

  for (let i = 1; i <= horizon; i += 1) {
    if (ignoreGoals || !reachedGoal) {
      balance += monthlyInflow;
    }
    if (!ignoreGoals && target && balance >= target) {
      balance = target;
      reachedGoal = true;
      if (goalReachedMonthIndex == null) {
        goalReachedMonthIndex = i;
      }
    }
    points.push({ monthIndex: i, balance, atGoal: reachedGoal });
  }

  return {
    startBalance: start,
    monthlyInflow,
    goalAmount: ignoreGoals ? null : target,
    goalDate: ignoreGoals ? null : (income.goalDate || null),
    monthsToGoal: ignoreGoals || !goalDate || goalDate <= now
      ? null
      : monthsUntilDate(goalDate, now),
    goalReachedMonthIndex: ignoreGoals ? null : goalReachedMonthIndex,
    points,
  };
}

/**
 * Whether the stash ledger has savings-tab movements in the chart year.
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {number} [year]
 * @returns {boolean}
 */
export function hasActualSavingsHistory(budget, year = new Date().getFullYear()) {
  if (!budget) return false;
  const prefix = `${year}-`;
  return getStashMovements(budget).some(
    (row) => isSavingsTabStashRef(row.stashRef, budget) && row.date.startsWith(prefix),
  );
}

/**
 * @param {import('./schema').StashMovement[]} movements
 * @param {number} currentBalance
 * @param {number} monthsBack
 * @param {Date} now
 * @returns {{ monthIndex: number, balance: number, monthDate: Date }[]}
 */
function buildHistoricalBalanceSeries(movements, currentBalance, monthsBack, now) {
  /** @type {Map<string, number>} */
  const netByMonth = new Map();
  movements.forEach((row) => {
    const mk = row.date.slice(0, 7);
    const delta = row.direction === 'in'
      ? Number(row.amount) || 0
      : -(Number(row.amount) || 0);
    netByMonth.set(mk, roundMoney((netByMonth.get(mk) || 0) + delta));
  });

  /** @type {{ monthIndex: number, balance: number, monthDate: Date }[]} */
  const points = [{
    monthIndex: 0,
    balance: currentBalance,
    monthDate: new Date(now.getFullYear(), now.getMonth(), 1),
  }];

  let balance = currentBalance;
  for (let i = 1; i <= monthsBack; i += 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const futureMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const net = netByMonth.get(monthKeyFromDate(futureMonthDate)) || 0;
    balance = roundMoney(balance - net);
    points.unshift({ monthIndex: -i, balance, monthDate });
  }

  const firstActiveIdx = points.findIndex((p) => {
    const net = netByMonth.get(monthKeyFromDate(p.monthDate));
    return net != null && net !== 0;
  });
  if (firstActiveIdx > 0) {
    return points.slice(firstActiveIdx);
  }

  return points;
}

/**
 * Whether a single stash tab has movement history in the chart year.
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {string} stashRef
 * @param {number} [year]
 * @returns {boolean}
 */
export function hasStashHistory(budget, stashRef, year = new Date().getFullYear()) {
  if (!budget || !stashRef) return false;
  const prefix = `${year}-`;
  return getStashMovements(budget).some(
    (row) => row.stashRef === stashRef && row.date.startsWith(prefix),
  );
}

/**
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   income: import('./schema').Income|null|undefined,
 *   monthsBack?: number,
 *   now?: Date,
 * }} params
 * @returns {{ monthIndex: number, balance: number, monthDate: Date }[]}
 */
export function buildActualSavingsSeries({
  budget,
  income,
  monthsBack = 3,
  now = new Date(),
}) {
  const currentBalance = resolveSavingsStartBalance(budget, income);
  const movements = getStashMovements(budget).filter((row) => isSavingsTabStashRef(row.stashRef, budget));
  return buildHistoricalBalanceSeries(movements, currentBalance, monthsBack, now);
}

/**
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   stashRef: string,
 *   currentBalance: number,
 *   monthsBack?: number,
 *   now?: Date,
 * }} params
 * @returns {{ monthIndex: number, balance: number, monthDate: Date }[]}
 */
export function buildStashHistoricalSeries({
  budget,
  stashRef,
  currentBalance,
  monthsBack = 3,
  now = new Date(),
}) {
  const movements = getStashMovements(budget).filter((row) => row.stashRef === stashRef);
  return buildHistoricalBalanceSeries(movements, currentBalance, monthsBack, now);
}

/**
 * Single-stash historical chart payload (actual line only, Jan–current month).
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   stashRef: string,
 *   currentBalance: number,
 *   now?: Date,
 * }} params
 */
export function buildStashHistoryChartData({
  budget,
  stashRef,
  currentBalance,
  now = new Date(),
}) {
  const year = now.getFullYear();
  const currentMonth = now.getMonth();
  const resolvedMonthsBack = Math.max(3, currentMonth);
  const hasActualHistory = hasStashHistory(budget, stashRef, year);
  const actualPoints = hasActualHistory
    ? buildStashHistoricalSeries({
      budget,
      stashRef,
      currentBalance,
      monthsBack: resolvedMonthsBack,
      now,
    })
    : [];

  return {
    startBalance: currentBalance,
    monthlyInflow: 0,
    actualPoints,
    projectedPoints: [],
    hasActualHistory,
    chartYear: year,
    currentMonth,
    now,
  };
}

/**
 * Chart payload — actual history + projected growth through end of chart year.
 * @param {{
 *   financials: import('./householdBudget').HouseholdFinancials,
 *   goalGap?: { monthlyRequired?: number }|null,
 *   monthsBack?: number,
 *   now?: Date,
 * }} params
 */
export function buildSavingsChartData({
  financials,
  goalGap = null,
  monthsBack = 3,
  now = new Date(),
}) {
  const budget = financials.budget;
  const income = financials.income || {};
  const year = now.getFullYear();
  const currentMonth = now.getMonth();
  const yearMonthsBack = currentMonth;
  const yearMonthsAhead = 11 - currentMonth;
  const resolvedMonthsBack = Math.max(monthsBack, yearMonthsBack);

  const projection = buildSavingsProjection({
    financials,
    goalGap,
    monthsAhead: yearMonthsAhead,
    now,
    ignoreGoals: true,
  });
  const hasActualHistory = hasActualSavingsHistory(budget, year);
  const actualPoints = hasActualHistory
    ? buildActualSavingsSeries({
      budget,
      income,
      monthsBack: resolvedMonthsBack,
      now,
    })
    : [];

  return {
    startBalance: projection.startBalance,
    monthlyInflow: projection.monthlyInflow,
    actualPoints,
    projectedPoints: projection.points,
    monthsBack: resolvedMonthsBack,
    hasActualHistory,
    chartYear: year,
    currentMonth,
    now,
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

/**
 * Expected total stash balance at end of calendar year if monthly plan is followed.
 * @param {{
 *   financials: import('./householdBudget').HouseholdFinancials,
 *   goalGap?: { monthlyRequired?: number }|null,
 *   now?: Date,
 * }} params
 * @returns {{ expectedBalance: number, year: number, monthlyInflow: number, monthsRemaining: number, startBalance: number, cappedAtGoal: boolean }}
 */
export function getExpectedYearEndSavings({ financials, goalGap = null, now = new Date() }) {
  const startBalance = getTotalSavingsBalance(financials, goalGap);
  const yearEnd = new Date(now.getFullYear(), 11, 31);
  const monthsRemaining = monthsUntilDate(yearEnd, now);

  const projection = buildSavingsProjection({
    financials,
    goalGap,
    monthsAhead: monthsRemaining,
    now,
  });

  const lastPoint = projection.points[projection.points.length - 1];
  const expectedBalance = lastPoint?.balance ?? startBalance;
  const income = financials.income || {};
  const target = hasTargetSavingsGoal(income) ? Number(income.goalAmount) || 0 : null;

  return {
    expectedBalance,
    year: now.getFullYear(),
    monthlyInflow: projection.monthlyInflow,
    monthsRemaining,
    startBalance,
    cappedAtGoal: Boolean(target && lastPoint?.atGoal && expectedBalance >= target),
  };
}
