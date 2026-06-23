import {
  buildMonthGrid,
  enumerateCycleDaysInclusive,
  getCycleMonthBounds,
  isDateInCycleRange,
  monthIndexFromIso,
  shiftCalendarMonth,
  shiftViewMonth,
} from '../../lib/cycleCalendarGrid';
import { isoDateKey } from '../../lib/dailyLog';

describe('cycleCalendarGrid', () => {
  const cycle = {
    id: 'c1',
    startedAt: '2026-06-10',
    budgetAmount: 10000,
    status: 'active',
  };

  it('includes today in cycle range', () => {
    expect(isDateInCycleRange('2026-06-10', cycle.startedAt, '2026-06-15')).toBe(true);
    expect(isDateInCycleRange('2026-06-15', cycle.startedAt, '2026-06-15')).toBe(true);
    expect(isDateInCycleRange('2026-06-16', cycle.startedAt, '2026-06-15')).toBe(false);
    expect(isDateInCycleRange('2026-06-09', cycle.startedAt, '2026-06-15')).toBe(false);
  });

  it('enumerates cycle days through today inclusive', () => {
    const days = enumerateCycleDaysInclusive('2026-06-10', '2026-06-12');
    expect(days).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']);
  });

  it('marks locked cells when no active cycle', () => {
    const cells = buildMonthGrid(2026, 5, { todayIso: '2026-06-15' });
    const day15 = cells.find((c) => c.isoDate === '2026-06-15');
    expect(day15?.kind).toBe('locked');
  });

  it('marks unset and confirmed cycle days in month grid', () => {
    const cells = buildMonthGrid(2026, 5, {
      activeCycle: cycle,
      dailyLogs: [
        { date: '2026-06-10', spent: 100, status: 'confirmed', cycleId: 'c1' },
        { date: '2026-06-11', spent: null, status: 'unset', cycleId: 'c1' },
      ],
      todayIso: '2026-06-12',
    });

    expect(cells.find((c) => c.isoDate === '2026-06-10')?.kind).toBe('confirmed');
    expect(cells.find((c) => c.isoDate === '2026-06-11')?.kind).toBe('unset');
    expect(cells.find((c) => c.isoDate === '2026-06-09')?.kind).toBe('outside');
    expect(cells.find((c) => c.isoDate === '2026-06-12')?.kind).toBe('unset');
  });

  it('shifts calendar months without cycle bounds', () => {
    expect(shiftCalendarMonth(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
    expect(shiftCalendarMonth(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 });
    expect(shiftCalendarMonth(2026, 5, 1)).toEqual({ year: 2026, monthIndex: 6 });
  });

  it('limits month navigation to cycle bounds (legacy helper)', () => {
    const bounds = getCycleMonthBounds('2026-05-28', '2026-06-15');
    expect(shiftViewMonth(2026, 5, bounds, -1)).toEqual({ year: 2026, monthIndex: 4 });
    expect(shiftViewMonth(2026, 4, bounds, -1)).toBeNull();
    expect(shiftViewMonth(2026, 5, bounds, 1)).toBeNull();
  });

  it('parses month index from ISO date', () => {
    expect(monthIndexFromIso('2026-06-10')).toEqual({ year: 2026, monthIndex: 5 });
    expect(monthIndexFromIso('2025-01-01')).toEqual({ year: 2025, monthIndex: 0 });
  });
});
