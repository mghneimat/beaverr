import { buildCycleCountBurnRate } from '../../lib/cycleBurnRate';
import {
  classifyClosedCycle,
  computeSummaryCycleCounts,
} from '../../lib/summaryCycleStats';

describe('buildCycleCountBurnRate', () => {
  test('splits cycle counts into as planned, saved, and deficit segments', () => {
    const burn = buildCycleCountBurnRate({
      total: 10,
      asPlanned: 5,
      savedMoney: 2,
      deficit: 3,
      inProgress: 0,
    });

    expect(burn.income).toBe(10);
    expect(burn.segments.map((seg) => seg.key)).toEqual(['asPlanned', 'saved', 'deficit']);
    expect(burn.segments.map((seg) => seg.value)).toEqual([5, 2, 3]);
  });

  test('includes in-progress segment for the active cycle', () => {
    const burn = buildCycleCountBurnRate({
      total: 4,
      asPlanned: 2,
      savedMoney: 1,
      deficit: 0,
      inProgress: 1,
    });

    expect(burn.segments.some((seg) => seg.key === 'inProgress')).toBe(true);
    expect(burn.segments.reduce((sum, seg) => sum + seg.value, 0)).toBe(4);
  });
});

describe('computeSummaryCycleCounts', () => {
  test('classifies closed cycles and counts active as in progress', () => {
    expect(classifyClosedCycle({ surplus: 0, deficit: 0 })).toBe('asPlanned');
    expect(classifyClosedCycle({ surplus: 500, deficit: 0 })).toBe('saved');
    expect(classifyClosedCycle({ surplus: 0, deficit: 200 })).toBe('deficit');

    const counts = computeSummaryCycleCounts({
      cycles: [
        { id: 'a', status: 'closed', startedAt: '2026-04-01', closedAt: '2026-04-28', surplus: 0, deficit: 0 },
        { id: 'b', status: 'closed', startedAt: '2026-05-01', closedAt: '2026-05-28', surplus: 100, deficit: 0 },
        { id: 'c', status: 'closed', startedAt: '2026-06-01', closedAt: '2026-06-28', surplus: 0, deficit: 50 },
        { id: 'd', status: 'active', startedAt: '2026-07-01' },
      ],
      activeCycleId: 'd',
    });

    expect(counts.total).toBe(4);
    expect(counts.asPlanned).toBe(1);
    expect(counts.savedMoney).toBe(1);
    expect(counts.deficit).toBe(1);
    expect(counts.inProgress).toBe(1);
  });
});
