import { periodKey, sumSpentInPeriod } from './dailyLog';

/**
 * Flexible spending pool minus logged spend this month (includes rollover).
 * Negative = over budget for the month.
 * @param {import('./householdBudget').HouseholdFinancials & { dailyLogs?: import('./schema').DailyLog[] }} financials
 * @param {Date} [now]
 * @returns {{ spendingPool: number, spent: number, left: number }}
 */
export function computeFlexibleRemaining(financials, now = new Date()) {
  const budget = financials.budget || {};
  const rolloverBalance = Number(budget.rolloverBalance) || 0;
  const flexible = Number(financials.effectiveMonthlyFlexible ?? financials.monthlyFlexible) || 0;
  const spendingPool = flexible + rolloverBalance;
  const period = periodKey(now);
  const spent = sumSpentInPeriod(financials.dailyLogs || [], period);
  return {
    spendingPool,
    spent,
    left: spendingPool - spent,
  };
}
