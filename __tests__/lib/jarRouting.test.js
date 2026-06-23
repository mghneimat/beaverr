import {
  routeDayLeftover,
  applyDayEndRoute,
  processDayEndIfNeeded,
  computeSpendableMonthPool,
  computeSavedSoFar,
  nextDay,
  previousDay,
} from '../../lib/jarRouting';
import { roundMoney, divideMoney } from '../../lib/finance';

describe('routeDayLeftover', () => {
  it('keeps unspent allowance in pool when spendingBoost destination', () => {
    const route = routeDayLeftover({
      leftover: 200,
      budget: { dailyJarDestination: 'spendingBoost' },
    });
    expect(route.removedFromPool).toBe(0);
  });

  it('routes unspent allowance to piggy bank', () => {
    const route = routeDayLeftover({
      leftover: 200,
      budget: { dailyJarDestination: 'looseMoney' },
    });
    expect(route.toLooseMoney).toBe(200);
    expect(route.removedFromPool).toBe(200);
  });

  it('routes to savings', () => {
    const route = routeDayLeftover({
      leftover: 120,
      budget: { dailyJarDestination: 'savings' },
    });
    expect(route.toSavings).toBe(120);
    expect(route.removedFromPool).toBe(120);
  });

  it('maps legacy activity destination to spending pool via strategy resolver', () => {
    const route = routeDayLeftover({
      leftover: 300,
      budget: { dailyJarDestination: 'activity' },
    });
    expect(route.removedFromPool).toBe(0);
  });
});

describe('processDayEndIfNeeded', () => {
  it('processes completed days and updates piggy bank', () => {
    const now = new Date(2026, 5, 10);
    const yesterday = previousDay('2026-06-10');
    const { budget, closedDays } = processDayEndIfNeeded({
      budget: {
        lastClosedDay: '2026-06-08',
        dailyJarDestination: 'looseMoney',
        looseMoneyBalance: 0,
        jarredThisMonth: 0,
      },
      effectiveMonthlyFlexible: 3000,
      dailyLogs: [
        { date: '2026-06-09', spent: 50 },
      ],
      now,
    });
    expect(closedDays).toEqual(['2026-06-09']);
    expect(budget.looseMoneyBalance).toBeGreaterThan(0);
    expect(budget.lastClosedDay).toBe(yesterday);
  });

  it('skips jar routing when bulk backfilling past cycle days', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    const yesterday = '2026-06-17';
    const dailyLogs = [];
    let d = '2026-05-19';
    while (d <= yesterday) {
      dailyLogs.push({ date: d, spent: 200, status: 'confirmed', cycleId: 'c1' });
      d = nextDay(d);
    }

    const { budget } = processDayEndIfNeeded({
      budget: {
        lastClosedDay: '2026-05-18',
        dailyJarDestination: 'looseMoney',
        looseMoneyBalance: 0,
        jarredThisMonth: 0,
        dayEndHistory: [],
      },
      effectiveMonthlyFlexible: 10000,
      dailyLogs,
      activeCycle: cycle,
      cyclesEnabled: true,
      now: new Date(2026, 5, 18),
    });

    const jarred = (budget.dayEndHistory || []).reduce(
      (sum, entry) => sum + (Number(entry.toLooseMoney) || 0) + (Number(entry.toSavings) || 0),
      0,
    );
    expect(jarred).toBe(0);
    expect(budget.looseMoneyBalance).toBe(0);
    expect(budget.lastClosedDay).toBe(yesterday);
  });

  it('applies backfill piggy jar when only yesterday is pending', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    const yesterday = '2026-06-17';
    const { budget } = processDayEndIfNeeded({
      budget: {
        lastClosedDay: '2026-06-16',
        dailyJarDestination: 'looseMoney',
        looseMoneyBalance: 0,
        jarredThisMonth: 0,
        dayEndHistory: [],
      },
      effectiveMonthlyFlexible: 10000,
      dailyLogs: [
        { date: yesterday, spent: 200, status: 'confirmed', cycleId: 'c1' },
      ],
      activeCycle: cycle,
      cyclesEnabled: true,
      now: new Date(2026, 5, 18),
    });

    const entry = budget.dayEndHistory?.[0];
    expect(entry?.closeKind).toBe('backfill');
    expect(entry?.toLooseMoney).toBeGreaterThan(0);
    expect(entry?.removedFromPool).toBe(entry?.dailyAllowance);
    expect(budget.lastClosedDay).toBe(yesterday);
  });

  it('applies backfill piggy jar when a single past day is logged', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    const { budget } = processDayEndIfNeeded({
      budget: {
        lastClosedDay: '2026-05-18',
        dailyJarDestination: 'looseMoney',
        looseMoneyBalance: 0,
        jarredThisMonth: 0,
        dayEndHistory: [],
      },
      effectiveMonthlyFlexible: 10000,
      dailyLogs: [
        { date: '2026-05-19', spent: 200, status: 'confirmed', cycleId: 'c1' },
      ],
      activeCycle: cycle,
      cyclesEnabled: true,
      now: new Date(2026, 5, 18),
    });

    const entry = budget.dayEndHistory?.[0];
    expect(entry?.closeKind).toBe('backfill');
    expect(entry?.dailyAllowance).toBe(483.87);
    expect(entry?.toLooseMoney).toBe(283.87);
    expect(entry?.removedFromPool).toBe(483.87);
    expect(budget.looseMoneyBalance).toBe(283.87);
    expect(budget.lastClosedDay).toBe('2026-05-19');

    const pace = computeCyclePace(cycle, [
      { date: '2026-05-19', spent: 200, status: 'confirmed', cycleId: 'c1' },
    ], budget, new Date(2026, 5, 18));
    expect(pace.pool).toBeCloseTo(14516.13, 2);
    expect(pace.dailyAllowance).toBeCloseTo(divideMoney(14516.13, 30), 2);
  });

  it('reconciles all unjarred piggy backfill days on load', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    const dailyLogs = [
      { date: '2026-05-19', spent: 200, status: 'confirmed', cycleId: 'c1' },
      { date: '2026-05-20', spent: 200, status: 'confirmed', cycleId: 'c1' },
    ];
    const { budget } = processDayEndIfNeeded({
      budget: {
        lastClosedDay: '2026-05-20',
        dailyJarDestination: 'looseMoney',
        looseMoneyBalance: 0,
        jarredThisMonth: 0,
        dayEndHistory: [],
      },
      effectiveMonthlyFlexible: 10000,
      dailyLogs,
      activeCycle: cycle,
      cyclesEnabled: true,
      now: new Date(2026, 5, 18),
    });

    expect(budget.dayEndHistory).toHaveLength(2);
    expect(budget.dayEndHistory.every((e) => e.closeKind === 'backfill')).toBe(true);
    expect(budget.looseMoneyBalance).toBeGreaterThan(0);
  });

  it('reconciles backfill piggy jar for a single day closed earlier without history', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    const { budget } = processDayEndIfNeeded({
      budget: {
        lastClosedDay: '2026-05-19',
        dailyJarDestination: 'looseMoney',
        looseMoneyBalance: 0,
        jarredThisMonth: 0,
        dayEndHistory: [],
      },
      effectiveMonthlyFlexible: 10000,
      dailyLogs: [
        { date: '2026-05-19', spent: 200, status: 'confirmed', cycleId: 'c1' },
      ],
      activeCycle: cycle,
      cyclesEnabled: true,
      now: new Date(2026, 5, 18),
    });

    expect(budget.dayEndHistory?.[0]?.toLooseMoney).toBe(283.87);
    expect(budget.looseMoneyBalance).toBe(283.87);
  });

  it('skips jar on backfill when destination is not piggy bank', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    const { budget } = processDayEndIfNeeded({
      budget: {
        lastClosedDay: '2026-05-18',
        dailyJarDestination: 'spendingBoost',
        looseMoneyBalance: 0,
        jarredThisMonth: 0,
        dayEndHistory: [],
      },
      effectiveMonthlyFlexible: 10000,
      dailyLogs: [
        { date: '2026-05-19', spent: 200, status: 'confirmed', cycleId: 'c1' },
      ],
      activeCycle: cycle,
      cyclesEnabled: true,
      now: new Date(2026, 5, 18),
    });

    expect(budget.dayEndHistory || []).toHaveLength(0);
    expect(budget.looseMoneyBalance).toBe(0);
    expect(budget.lastClosedDay).toBe('2026-05-19');
  });
});

describe('computeSpendableMonthPool', () => {
  it('subtracts jarred amounts from month pool', () => {
    expect(computeSpendableMonthPool(
      { rolloverBalance: 0, jarredThisMonth: 400 },
      3000,
    )).toBe(2600);
  });
});

describe('computeSavedSoFar', () => {
  it('includes piggy bank deposits from closed days and prorated savings', () => {
    const result = computeSavedSoFar({
      budget: {
        dayEndHistory: [
          { date: '2026-06-08', toLooseMoney: 150 },
          { date: '2026-06-09', toLooseMoney: 100 },
        ],
      },
      income: { goalType: 'saveMoney', saveMode: 'ongoing', savingsMonthlyTarget: 3000 },
      goalGap: null,
      frequency: 'monthly',
      dailyLogs: [],
      effectiveMonthlyFlexible: 10000,
      now: new Date(2026, 5, 10),
    });
    expect(result.underspendSaved).toBe(250);
    expect(result.plannedSavingsElapsed).toBeGreaterThan(0);
    expect(result.totalMonthly).toBe(result.underspendSaved + result.plannedSavingsElapsed);
  });
});

describe('nextDay', () => {
  it('advances iso date by one day', () => {
    expect(nextDay('2026-06-30')).toBe('2026-07-01');
  });
});

describe('applyDayEndRoute', () => {
  it('mutates piggy bank balance', () => {
    const budget = { looseMoneyBalance: 0, jarredThisMonth: 0 };
    applyDayEndRoute(budget, {
      toLooseMoney: 150,
      toSavings: 0,
      removedFromPool: 150,
      jarredThisMonth: 150,
    });
    expect(budget.looseMoneyBalance).toBe(150);
    expect(budget.jarredThisMonth).toBe(150);
  });

  it('adds savings when income provided', () => {
    const budget = { jarredThisMonth: 0 };
    const income = { savingsBalance: 1000 };
    applyDayEndRoute(budget, {
      toLooseMoney: 0,
      toSavings: 80,
      removedFromPool: 80,
      jarredThisMonth: 80,
    }, income);
    expect(income.savingsBalance).toBe(1080);
    expect(budget.jarredThisMonth).toBe(80);
  });
});
