export const SAVINGS_CHART_MONTH_COUNT = 12;

/**
 * Full calendar-year month indices (Jan = 0 … Dec = 11).
 * @param {number} [yearMonths=12]
 * @returns {number[]}
 */
export function getSavingsChartCalendarMonths(yearMonths = SAVINGS_CHART_MONTH_COUNT) {
  return Array.from({ length: yearMonths }, (_, i) => i);
}

/**
 * @param {number} [yearMonths=12]
 * @returns {{ startMonth: number, endMonth: number, months: number[] }}
 */
export function resolveSavingsChartMonthWindow(_currentMonth, _horizon, yearMonths = SAVINGS_CHART_MONTH_COUNT) {
  const months = getSavingsChartCalendarMonths(yearMonths);
  return {
    startMonth: 0,
    endMonth: yearMonths - 1,
    months,
  };
}
