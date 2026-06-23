import {
  buildCycleDayLedgerSummary,
  buildCycleDayRows,
  filterCycleDayRows,
  groupCycleDayRowsByWeek,
  formatWeekRangeLabel,
} from '../../lib/cycleDayLedger';

describe('cycleDayLedger', () => {
  const cycle = {
    id: 'c1',
    startedAt: '2026-06-10',
    budgetAmount: 10000,
    status: 'active',
  };

  const logs = [
    { date: '2026-06-10', spent: 100, status: 'confirmed', cycleId: 'c1' },
    { date: '2026-06-11', spent: null, status: 'unset', cycleId: 'c1' },
    { date: '2026-06-12', spent: 0, status: 'confirmed', cycleId: 'c1' },
  ];

  it('builds rows newest first through today', () => {
    const rows = buildCycleDayRows(cycle, logs, new Date(2026, 5, 12));
    expect(rows.map((r) => r.isoDate)).toEqual(['2026-06-12', '2026-06-11', '2026-06-10']);
    expect(rows[0]).toMatchObject({ status: 'confirmed', spent: 0, isToday: true });
    expect(rows[1]).toMatchObject({ status: 'unset', spent: null, isToday: false });
    expect(rows[2]).toMatchObject({ status: 'confirmed', spent: 100, isToday: false });
  });

  it('summarizes logged days and spent total', () => {
    const rows = buildCycleDayRows(cycle, logs, new Date(2026, 5, 12));
    expect(buildCycleDayLedgerSummary(rows)).toEqual({
      totalDays: 3,
      loggedDays: 2,
      spentTotal: 100,
    });
  });

  it('filters unset rows for needs tab', () => {
    const rows = buildCycleDayRows(cycle, logs, new Date(2026, 5, 12));
    expect(filterCycleDayRows(rows, 'needs')).toHaveLength(1);
    expect(filterCycleDayRows(rows, 'needs')[0].isoDate).toBe('2026-06-11');
    expect(filterCycleDayRows(rows, 'all')).toHaveLength(3);
  });

  it('groups rows by week with current week first and today on top', () => {
    const longCycle = { ...cycle, startedAt: '2026-06-02' };
    const weeks = groupCycleDayRowsByWeek(
      buildCycleDayRows(longCycle, logs, new Date(2026, 5, 12)),
    );
    expect(weeks).toHaveLength(2);
    expect(weeks[0].weekStart).toBe('2026-06-09');
    expect(weeks[0].rows.map((r) => r.isoDate)).toEqual(['2026-06-12', '2026-06-11', '2026-06-10', '2026-06-09']);
    expect(weeks[1].weekStart).toBe('2026-06-02');
    expect(weeks[1].rows.map((r) => r.isoDate)).toEqual(['2026-06-08', '2026-06-07', '2026-06-06', '2026-06-05', '2026-06-04', '2026-06-03', '2026-06-02']);
  });

  it('formats week range label within the same month', () => {
    expect(formatWeekRangeLabel('2026-06-09', '2026-06-15', 'en')).toBe('9–15 Jun 2026');
  });
});
