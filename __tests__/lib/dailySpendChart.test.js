import {
  buildDailySpendChartDays,
  buildMonthPeriodOptions,
  formatDailySpendTooltipDate,
  maxDailySpendChartHeight,
  resolveMonthlySpendingBudget,
} from '../../lib/dailySpendChart';
import {
  buildSummaryCycleHistoryRows,
  computeSummaryCycleCounts,
  computeSummaryCycleOverview,
} from '../../lib/summaryCycleStats';

describe('summaryCycleStats', () => {
  test('computeSummaryCycleOverview counts active + closed cycles', () => {
    const overview = computeSummaryCycleOverview({
      cycles: [
        { id: 'a', status: 'closed', startedAt: '2026-04-01', closedAt: '2026-04-28' },
        { id: 'b', status: 'closed', startedAt: '2026-05-01', closedAt: '2026-05-28' },
        { id: 'c', status: 'active', startedAt: '2026-06-01' },
      ],
      activeCycleId: 'c',
    });
    expect(overview.elapsedCycles).toBe(3);
    expect(overview.closedCount).toBe(2);
    expect(overview.hasActiveCycle).toBe(true);
  });

  test('computeSummaryCycleCounts classifies closed cycles', () => {
    const counts = computeSummaryCycleCounts({
      cycles: [
        {
          id: 'a',
          status: 'closed',
          startedAt: '2026-04-01',
          closedAt: '2026-04-28',
          surplus: 1500,
          deficit: 0,
        },
        {
          id: 'b',
          status: 'closed',
          startedAt: '2026-05-01',
          closedAt: '2026-05-28',
          surplus: 0,
          deficit: 800,
        },
        { id: 'c', status: 'active', startedAt: '2026-06-01' },
      ],
      activeCycleId: 'c',
    });
    expect(counts.total).toBe(3);
    expect(counts.asPlanned).toBe(0);
    expect(counts.savedMoney).toBe(1);
    expect(counts.deficit).toBe(1);
    expect(counts.inProgress).toBe(1);
  });

  test('buildSummaryCycleHistoryRows maps closed cycle totals', () => {
    const rows = buildSummaryCycleHistoryRows({
      cycles: [{
        id: 'c1',
        status: 'closed',
        startedAt: '2026-05-01',
        closedAt: '2026-05-28',
        budgetAmount: 10000,
        spentTotal: 8000,
        surplus: 2000,
        deficit: 0,
      }],
      activeCycleId: null,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].budget).toBe(10000);
    expect(rows[0].spent).toBe(8000);
    expect(rows[0].surplus).toBe(2000);
  });
});

describe('dailySpendChart', () => {
  test('buildDailySpendChartDays stacks cushion for under-budget past day', () => {
    const days = buildDailySpendChartDays({
      period: '2026-06',
      dailyLogs: [{ date: '2026-06-01', spent: 50, status: 'confirmed' }],
      monthlyBudget: 3000,
      now: new Date(2026, 5, 15),
    });
    const first = days[0];
    expect(first.spent).toBe(50);
    expect(first.cushionType).toBe('saved');
    expect(first.cushion).toBeGreaterThan(0);
    expect(first.deficit).toBe(0);
  });

  test('buildDailySpendChartDays marks deficit when over allowance', () => {
    const days = buildDailySpendChartDays({
      period: '2026-06',
      dailyLogs: [{ date: '2026-06-02', spent: 500, status: 'confirmed' }],
      monthlyBudget: 3000,
      now: new Date(2026, 5, 15),
    });
    const day = days[1];
    expect(day.deficit).toBeGreaterThan(0);
    expect(day.columnHeight).toBe(day.spent);
    expect(day.status).toBe('over');
  });

  test('buildDailySpendChartDays uses remaining for today', () => {
    const days = buildDailySpendChartDays({
      period: '2026-06',
      dailyLogs: [{ date: '2026-06-15', spent: 40, status: 'confirmed' }],
      monthlyBudget: 3000,
      now: new Date(2026, 5, 15),
    });
    const today = days[14];
    expect(today.isToday).toBe(true);
    expect(today.cushionType).toBe('remaining');
    expect(today.cushion).toBeGreaterThan(0);
  });

  test('unlogged past days render as skeleton', () => {
    const days = buildDailySpendChartDays({
      period: '2026-06',
      dailyLogs: [],
      monthlyBudget: 3000,
      now: new Date(2026, 5, 15),
    });
    expect(days[0].isSkeletonColumn).toBe(true);
    expect(days[0].cushion).toBe(0);
    expect(days[0].cushionType).toBeNull();
  });

  test('confirmed backfilled day under budget shows saved cushion', () => {
    const days = buildDailySpendChartDays({
      period: '2026-04',
      dailyLogs: [{ date: '2026-04-01', spent: 50, status: 'confirmed' }],
      monthlyBudget: 3000,
      now: new Date(2026, 5, 15),
    });
    expect(days[0].isSkeletonColumn).toBe(false);
    expect(days[0].cushionType).toBe('saved');
    expect(days[0].cushion).toBeGreaterThan(0);
    expect(days[0].spent).toBe(50);
    expect(days[0].status).toBe('under');
  });

  test('confirmed zero-spend backfilled day shows full saved cushion', () => {
    const days = buildDailySpendChartDays({
      period: '2026-04',
      dailyLogs: [{ date: '2026-04-03', spent: 0, status: 'confirmed' }],
      monthlyBudget: 3000,
      now: new Date(2026, 5, 15),
    });
    const day = days[2];
    expect(day.isSkeletonColumn).toBe(false);
    expect(day.spent).toBe(0);
    expect(day.cushionType).toBe('saved');
    expect(day.cushion).toBe(day.allowance);
    expect(day.status).toBe('under');
  });

  test('buildMonthPeriodOptions returns newest first', () => {
    const options = buildMonthPeriodOptions(new Date(2026, 5, 15), 3, 'en');
    expect(options).toHaveLength(3);
    expect(options[0].value).toBe('2026-06');
  });

  test('maxDailySpendChartHeight uses tallest column', () => {
    const days = buildDailySpendChartDays({
      period: '2026-06',
      dailyLogs: [{ date: '2026-06-02', spent: 900, status: 'confirmed' }],
      monthlyBudget: 3000,
      now: new Date(2026, 5, 15),
    });
    expect(maxDailySpendChartHeight(days)).toBeGreaterThan(days[0].allowance);
  });

  test('resolveMonthlySpendingBudget adds rollover for current month only', () => {
    expect(resolveMonthlySpendingBudget('2026-06', {
      budget: { rolloverBalance: 1000 },
      effectiveMonthlyFlexible: 5000,
      now: new Date(2026, 5, 10),
    })).toBe(6000);
    expect(resolveMonthlySpendingBudget('2026-05', {
      budget: { rolloverBalance: 1000 },
      effectiveMonthlyFlexible: 5000,
      now: new Date(2026, 5, 10),
    })).toBe(5000);
  });

  test('formatDailySpendTooltipDate formats ISO date for tooltip header', () => {
    const t = (key, params) => {
      if (key === 'common.monthsShort.june') return 'JUN';
      if (key === 'dashboard.summaryScreen.dailySpend.tooltipDate') {
        return `${params.day}-${params.month}-${params.year}`;
      }
      return key;
    };
    expect(formatDailySpendTooltipDate('2026-06-14', t, 'en')).toBe('14-Jun-2026');
  });
});
