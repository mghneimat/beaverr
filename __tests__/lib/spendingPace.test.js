import {
  computeSpendingPace,
  resolveSpendingPaceLevel,
  spendingPaceColor,
  spendingPaceMessageKey,
  maxSpendingPaceLevel,
  resolveSpendingPaceBanner,
  shouldShowSpendingPaceStatus,
  formatSpendingPacePercent,
  SPENDING_PACE_AHEAD_ALERT,
  SPENDING_PACE_AHEAD_IMPORTANT,
  spendingPaceBannerTheme,
  spendingPaceDisplaySpentRatio,
  buildSpendingPaceMessages,
} from '../../lib/spendingPace';
import { computeCyclePace } from '../../lib/cyclePace';
import { buildTrackerPreviews } from '../../lib/trackerPreview';

describe('spendingPace', () => {
  test('resolveSpendingPaceLevel pace-ahead thresholds', () => {
    expect(resolveSpendingPaceLevel(0.1, 0.1, 900, 1000)).toBe('good');
    expect(resolveSpendingPaceLevel(0.3, 0.1, 700, 1000)).toBe('important');
    expect(resolveSpendingPaceLevel(0.55, 0.1, 450, 1000)).toBe('critical');
    expect(resolveSpendingPaceLevel(0.2, 0.1, 800, 1000)).toBe('alert');
    expect(resolveSpendingPaceLevel(1, 0.5, -1, 1000)).toBe('critical');
    expect(resolveSpendingPaceLevel(0.5, 0.5, 0, 1000)).toBe('critical');
  });

  test('computeSpendingPace returns ratios and ahead delta', () => {
    const pace = computeSpendingPace({
      spent: 3000,
      budgetEnvelope: 10000,
      elapsedUnits: 3,
      totalUnits: 30,
      remaining: 7000,
    });
    expect(pace.spentRatio).toBeCloseTo(0.3, 5);
    expect(pace.timeRatio).toBeCloseTo(0.1, 5);
    expect(pace.ahead).toBeCloseTo(0.2, 5);
    expect(pace.level).toBe('important');
    expect(pace.color).toBe(spendingPaceColor('important'));
  });

  test('spendingPaceMessageKey returns pace level', () => {
    expect(spendingPaceMessageKey('critical')).toBe('critical');
    expect(spendingPaceMessageKey('good')).toBe('good');
  });

  test('resolveSpendingPaceBanner keeps pace warnings during backfill', () => {
    expect(resolveSpendingPaceBanner({ backfillPending: true, level: 'good' }).status)
      .toBe('backfillPending');
    expect(resolveSpendingPaceBanner({ backfillPending: true, level: 'important' }).status)
      .toBe('important');
    expect(resolveSpendingPaceBanner({ backfillPending: true, level: 'important' }).showBackfillNote)
      .toBe(true);
    expect(resolveSpendingPaceBanner({ backfillPending: false, level: 'good', scope: 'month' }).visible)
      .toBe(false);
  });

  test('resolveSpendingPaceBanner shows on-plan banner for active pay cycle', () => {
    const banner = resolveSpendingPaceBanner({
      level: 'good',
      scope: 'cycle',
      timeRatio: 0.03,
      spentRatio: 0,
    });
    expect(banner.visible).toBe(true);
    expect(banner.status).toBe('good');
    expect(banner.showDetail).toBe(true);
  });

  test('shouldShowSpendingPaceStatus during backfill', () => {
    expect(shouldShowSpendingPaceStatus('good', true)).toBe(false);
    expect(shouldShowSpendingPaceStatus('important', true)).toBe(true);
  });

  test('maxSpendingPaceLevel picks more severe level', () => {
    expect(maxSpendingPaceLevel('good', 'important')).toBe('important');
    expect(maxSpendingPaceLevel('critical', 'alert')).toBe('critical');
  });

  test('resolveSpendingPaceBanner shows alert when display pace ahead despite pool on plan', () => {
    const banner = resolveSpendingPaceBanner({
      backfillPending: false,
      level: 'important',
      timeRatio: 0.17,
      spentRatio: 0.22,
    });
    expect(banner.visible).toBe(true);
    expect(banner.status).toBe('important');
  });

  test('formatSpendingPacePercent rounds to whole percent', () => {
    expect(formatSpendingPacePercent(0.256)).toBe('26%');
  });

  test('threshold constants match plan', () => {
    expect(SPENDING_PACE_AHEAD_ALERT).toBe(0.10);
    expect(SPENDING_PACE_AHEAD_IMPORTANT).toBe(0.25);
  });

  test('spendingPaceBannerTheme maps status to tinted surfaces', () => {
    expect(spendingPaceBannerTheme('good').textColor).toBe(spendingPaceColor('good'));
    expect(spendingPaceBannerTheme('backfillPending').backgroundColor).toBeDefined();
    expect(spendingPaceBannerTheme('critical').textColor).toBe(spendingPaceColor('critical'));
  });

  test('buildSpendingPaceMessages returns status summary only', () => {
    const t = (key) => (key === 'dashboard.spendingPace.good' ? 'On plan' : key);
    const { lineMessage } = buildSpendingPaceMessages(t, { messageKey: 'good' });
    expect(lineMessage).toBe('On plan');
  });
});

describe('spendingPace cycle integration', () => {
  test('computeCyclePace attaches paceLevel from time vs spend', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-06-01',
      budgetAmount: 10000,
    };
    const logs = [
      { date: '2026-06-01', spent: 9000, status: 'confirmed', cycleId: 'c1' },
    ];
    const pace = computeCyclePace(cycle, logs, {}, new Date(2026, 5, 1));
    expect(pace.paceLevel).toBe('critical');
    expect(pace.timeRatio).toBeGreaterThan(0);
    expect(pace.spentRatio).toBeGreaterThan(0.8);
    expect(pace.displaySpentRatio).toBeCloseTo(0.9, 5);
    expect(pace.displaySpentRatio).toBe(pace.spent / cycle.budgetAmount);
  });
});

describe('spendingPace calendar integration', () => {
  test('buildTrackerPreviews exposes monthly period pace', () => {
    const now = new Date(2026, 5, 15);
    const previews = buildTrackerPreviews({
      budget: { rolloverBalance: 0 },
      effectiveMonthlyFlexible: 3000,
      dailyLogs: [
        { date: '2026-06-01', spent: 500, status: 'confirmed' },
        { date: '2026-06-15', spent: 1000, status: 'confirmed' },
      ],
      now,
    });
    expect(previews.periodPace?.scope).toBe('month');
    expect(previews.periodPace?.level).toBeDefined();
    expect(previews.weekly?.spendingPace).toBeDefined();
    expect(previews.monthly?.spendingPace).toBeDefined();
  });
});
