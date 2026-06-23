import {
  buildMonthEndPreview,
  computeMonthLeftover,
  normalizeResetDestination,
  routeLeftover,
  applyMonthEndRoute,
} from '../../lib/monthEndRouting';

describe('normalizeResetDestination', () => {
  it('maps legacy forfeit to looseMoney', () => {
    expect(normalizeResetDestination('forfeit')).toBe('looseMoney');
    expect(normalizeResetDestination('savings')).toBe('savings');
  });
});

describe('routeLeftover', () => {
  it('adds full amount to rollover for free strategy', () => {
    const route = routeLeftover({
      leftover: 3000,
      budget: { rolloverStrategy: 'free' },
      monthlyFlexible: 15000,
      rolloverBalance: 1000,
    });
    expect(route.destination).toBe('rollover');
    expect(route.amount).toBe(3000);
    expect(route.newRolloverBalance).toBe(4000);
  });

  it('treats legacy capped strategy like free rollover after migration', () => {
    const route = routeLeftover({
      leftover: 5000,
      budget: {
        rolloverStrategy: 'capped',
        rolloverCapType: 'amount',
        rolloverCapAmount: 6000,
      },
      monthlyFlexible: 15000,
      rolloverBalance: 4000,
    });
    expect(route.destination).toBe('rollover');
    expect(route.amount).toBe(5000);
    expect(route.newRolloverBalance).toBe(9000);
  });

  it('routes reset strategy to loose money', () => {
    const route = routeLeftover({
      leftover: 2500,
      budget: { rolloverStrategy: 'reset', resetUnspentDestination: 'forfeit' },
      monthlyFlexible: 12000,
      rolloverBalance: 0,
    });
    expect(route.destination).toBe('looseMoney');
    expect(route.newRolloverBalance).toBe(0);
  });
});

describe('buildMonthEndPreview', () => {
  it('projects leftover from spending budget minus logs', () => {
    const preview = buildMonthEndPreview({
      budget: { rolloverStrategy: 'reset', resetUnspentDestination: 'savings' },
      effectiveMonthlyFlexible: 10000,
      dailyLogs: [
        { date: '2026-06-05', spent: 2000 },
        { date: '2026-06-12', spent: 1500 },
      ],
      now: new Date(2026, 5, 15),
    });
    expect(preview.spentSoFar).toBe(3500);
    expect(preview.projectedLeftover).toBe(6500);
    expect(preview.resetDestination).toBe('savings');
  });
});

describe('applyMonthEndRoute', () => {
  it('increments piggy bank balance on looseMoney destination', () => {
    const budget = { looseMoneyBalance: 1000 };
    applyMonthEndRoute(budget, null, {
      destination: 'looseMoney',
      amount: 500,
      newRolloverBalance: 0,
    });
    expect(budget.looseMoneyBalance).toBe(1500);
    expect(budget.rolloverBalance).toBe(0);
  });

  it('no longer routes capped excess to piggy bank', () => {
    const budget = { looseMoneyBalance: 100, rolloverBalance: 4000 };
    applyMonthEndRoute(budget, null, {
      destination: 'rollover',
      amount: 2000,
      newRolloverBalance: 6000,
    });
    expect(budget.rolloverBalance).toBe(6000);
    expect(budget.looseMoneyBalance).toBe(100);
  });
});

describe('computeMonthLeftover', () => {
  it('never returns negative leftover', () => {
    expect(computeMonthLeftover({ spendingBudget: 5000, spentInPeriod: 7000 })).toBe(0);
  });
});
