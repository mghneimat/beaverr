import {
  resolveDefaultCycleCloseDate,
  validateCycleDateRange,
  validateCycleEndDate,
  lastConfirmedLogDateInCycle,
  isBackfillCycle,
  recomputeClosedCycleTotals,
} from '../../lib/cycleCloseDates';
import { addMonthsMinusOneDay } from '../../lib/cycleJar';

describe('cycleCloseDates', () => {
  const cycle = {
    id: 'c1',
    status: 'active',
    startedAt: '2026-04-01',
    budgetAmount: 15000,
    plannedSavingsAmount: 0,
    spentTotal: 0,
    surplus: 0,
    deficit: 0,
    createdAt: '2026-04-01T00:00:00.000Z',
  };

  const aprilLogs = Array.from({ length: 30 }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    return {
      date: `2026-04-${day}`,
      spent: i === 1 ? 900 : 50,
      status: 'confirmed',
      cycleId: 'c1',
    };
  });

  test('resolveDefaultCycleCloseDate uses nominal end for full April backfill', () => {
    expect(resolveDefaultCycleCloseDate(cycle, aprilLogs, '2026-06-28')).toBe('2026-04-30');
  });

  test('resolveDefaultCycleCloseDate uses last log when earlier than nominal', () => {
    const partialLogs = aprilLogs.slice(0, 15);
    expect(resolveDefaultCycleCloseDate(cycle, partialLogs, '2026-06-28')).toBe('2026-04-15');
  });

  test('lastConfirmedLogDateInCycle finds latest confirmed day', () => {
    expect(lastConfirmedLogDateInCycle(cycle, aprilLogs)).toBe('2026-04-30');
  });

  test('isBackfillCycle when start is before today', () => {
    expect(isBackfillCycle(cycle, '2026-06-28')).toBe(true);
    expect(isBackfillCycle({ ...cycle, startedAt: '2026-06-28' }, '2026-06-28')).toBe(false);
  });

  test('validateCycleEndDate rejects end before start and future dates', () => {
    expect(validateCycleEndDate('2026-04-01', '2026-03-31')).toBe('validationEndBeforeStart');
    expect(validateCycleEndDate('2026-04-01', '2026-07-01', '2026-06-28')).toBe('validationEndFuture');
    expect(validateCycleEndDate('2026-04-01', '2026-04-30', '2026-06-28')).toBeNull();
  });

  test('validateCycleDateRange validates start and end together', () => {
    expect(validateCycleDateRange('2026-04-01', '2026-04-30', '2026-06-28')).toBeNull();
    expect(validateCycleDateRange('2026-07-01', '2026-07-31', '2026-06-28')).toBe('validationFuture');
  });

  test('recomputeClosedCycleTotals sums only through close date', () => {
    const logs = [
      { date: '2026-04-01', spent: 100, status: 'confirmed', cycleId: 'c1' },
      { date: '2026-05-01', spent: 500, status: 'confirmed', cycleId: 'c1' },
    ];
    const aprilClose = recomputeClosedCycleTotals(cycle, logs, {}, '2026-04-30');
    expect(aprilClose.spentTotal).toBe(100);
    const mayClose = recomputeClosedCycleTotals(cycle, logs, {}, '2026-05-31');
    expect(mayClose.spentTotal).toBe(600);
    expect(addMonthsMinusOneDay('2026-04-01')).toBe('2026-04-30');
  });
});
