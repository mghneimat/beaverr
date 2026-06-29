import { buildTrackerPreviews, getPaceStatus } from '../../lib/trackerPreview';

describe('getPaceStatus', () => {
  it('returns over when spent exceeds allowance', () => {
    expect(getPaceStatus(1000, 1200)).toBe('over');
  });

  it('returns under when well below allowance', () => {
    expect(getPaceStatus(1000, 500)).toBe('under');
  });
});

describe('buildTrackerPreviews', () => {
  it('builds daily, weekly, and monthly previews', () => {
    const previews = buildTrackerPreviews({
      budget: { rolloverStrategy: 'reset', resetUnspentDestination: 'looseMoney' },
      effectiveMonthlyFlexible: 30000,
      dailyLogs: [
        { date: '2026-06-08', spent: 500 },
        { date: '2026-06-09', spent: 300 },
      ],
      now: new Date(2026, 5, 8),
    });

    expect(previews.daily.spent).toBe(500);
    expect(previews.daily.allowance).toBeGreaterThan(0);
    expect(previews.weekly.spent).toBe(800);
    expect(previews.monthly.spentSoFar).toBe(800);
    expect(previews.monthly.projectedLeftover).toBeGreaterThan(0);
  });
});
