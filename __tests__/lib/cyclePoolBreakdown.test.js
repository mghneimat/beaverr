import { buildCyclePoolBreakdown } from '../../lib/cyclePoolBreakdown';

describe('buildCyclePoolBreakdown', () => {
  it('explains pool reduction from jarred amounts and rollover', () => {
    const breakdown = buildCyclePoolBreakdown({
      cycle: {
        id: 'c1',
        status: 'active',
        budgetAmount: 15000,
        startedAt: '2026-06-11',
      },
      budget: {
        jarredThisMonth: 2761,
        rolloverBalance: 0,
        dailyJarDestination: 'looseMoney',
      },
      cycleAdjustments: [],
    });

    expect(breakdown).not.toBeNull();
    expect(breakdown?.enteredAmount).toBe(15000);
    expect(breakdown?.pool).toBe(12239);
    expect(breakdown?.showBanner).toBe(true);
    expect(breakdown?.lines.some((l) => l.id === 'jarred' && l.amount === -2761)).toBe(true);
    expect(breakdown?.bannerRoute).toBe('budget');
    expect(breakdown?.bannerJarId).toBe('looseCash');
    expect(breakdown?.lines.find((l) => l.id === 'jarred')?.route).toBeUndefined();
  });

  it('always includes unspent daily allowance even when zero', () => {
    const breakdown = buildCyclePoolBreakdown({
      cycle: {
        id: 'c2',
        status: 'active',
        budgetAmount: 15000,
        startedAt: '2026-06-17',
      },
      budget: {
        jarredThisMonth: 0,
        rolloverBalance: 0,
      },
      cycleAdjustments: [],
    });

    expect(breakdown?.lines.find((l) => l.id === 'jarred')).toEqual({
      id: 'jarred',
      amount: 0,
      labelKey: 'dashboard.cycles.pace.breakdown.unspentDailyAllowance',
    });
    expect(breakdown?.showBanner).toBe(false);
  });
});
