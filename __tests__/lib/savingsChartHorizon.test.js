import {
  getSavingsChartCalendarMonths,
  resolveSavingsChartMonthWindow,
  SAVINGS_CHART_MONTH_COUNT,
} from '../../lib/savingsChartHorizon';

describe('savings chart calendar months', () => {
  it('always spans Jan through Dec', () => {
    expect(SAVINGS_CHART_MONTH_COUNT).toBe(12);
    expect(getSavingsChartCalendarMonths()).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it('resolveSavingsChartMonthWindow returns full year regardless of current month', () => {
    const window = resolveSavingsChartMonthWindow(5);
    expect(window.startMonth).toBe(0);
    expect(window.endMonth).toBe(11);
    expect(window.months).toHaveLength(12);
  });
});
