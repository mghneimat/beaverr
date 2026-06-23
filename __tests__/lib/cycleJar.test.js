import {
  addMonthsMinusOneDay,
  resolveCycleEndDate,
  countCycleRemainingDaysInclusive,
  countTotalCycleDays,
  countConfirmedCycleDays,
  countUnloggedCycleDaysForAllowance,
  sumJarredInCycle,
  getEffectiveCycleJarred,
  dedupeCycleDayEndHistory,
  capCycleLeftover,
} from '../../lib/cycleJar';
import { roundMoney, divideMoney } from '../../lib/finance';
import { nextDay } from '../../lib/dailyLog';
import { computeCyclePace, computeCycleDailyAllowanceForDate, computeBackfillPiggyDailyAllowance, computeCycleCloseBalance } from '../../lib/cyclePace';

describe('cycleJar', () => {
  const cycle = {
    id: 'c1',
    status: 'active',
    startedAt: '2026-05-18',
    budgetAmount: 15000,
  };

  test('addMonthsMinusOneDay returns nominal monthly end', () => {
    expect(addMonthsMinusOneDay('2026-05-18')).toBe('2026-06-17');
  });

  test('resolveCycleEndDate extends open cycle past nominal end', () => {
    expect(resolveCycleEndDate(cycle, '2026-06-17')).toBe('2026-06-17');
    expect(resolveCycleEndDate(cycle, '2026-06-18')).toBe('2026-06-18');
  });

  test('countCycleRemainingDaysInclusive does not reset at month boundary', () => {
    const daysFromMay25 = countCycleRemainingDaysInclusive('2026-05-25', cycle);
    const daysFromJune1 = countCycleRemainingDaysInclusive('2026-06-01', cycle);
    expect(daysFromMay25).toBeGreaterThan(daysFromJune1);
    expect(daysFromJune1).toBe(17);
  });

  test('countUnloggedCycleDaysForAllowance subtracts logged days from cycle length', () => {
    const mayCycle = {
      id: 'c2',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    expect(countTotalCycleDays(mayCycle)).toBe(31);
    const logs = [
      { date: '2026-05-19', spent: 200, status: 'confirmed', cycleId: 'c2' },
    ];
    expect(countConfirmedCycleDays(mayCycle, logs)).toBe(1);
    expect(countUnloggedCycleDaysForAllowance(mayCycle, logs)).toBe(30);
  });

  test('computeCyclePace remaining equals pool after piggy backfill days are jarred', () => {
    const mayCycle = {
      id: 'c2',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    /** @type {import('../../lib/schema').DayEndHistoryEntry[]} */
    const history = [];
    let poolRemoved = 0;
    let d = '2026-05-19';
    while (d <= '2026-06-17') {
      const unlogged = 31 - history.length;
      const daily = roundMoney(divideMoney(15000 - poolRemoved, unlogged));
      const spent = 200;
      history.push({
        date: d,
        cycleId: 'c2',
        closeKind: 'backfill',
        removedFromPool: daily,
        toLooseMoney: daily - spent,
        spent,
        dailyAllowance: daily,
      });
      poolRemoved += daily;
      d = nextDay(d);
    }
    const budget = { dayEndHistory: history, rolloverBalance: 0 };
    const logs = history.map((e) => ({
      date: e.date,
      spent: 200,
      status: 'confirmed',
      cycleId: 'c2',
    }));
    const pace = computeCyclePace(mayCycle, logs, budget, new Date(2026, 5, 18));
    expect(pace.spent).toBe(6000);
    expect(pace.pool).toBe(15000 - poolRemoved);
    expect(pace.remaining).toBe(pace.pool);
    expect(pace.paceLevel).toBe('good');
  });

  test('computeCyclePace counts piggy backfill overspend against remaining', () => {
    const mayCycle = {
      id: 'c2',
      status: 'active',
      startedAt: '2026-05-20',
      budgetAmount: 15000,
    };
    const budget = {
      rolloverBalance: 0,
      dayEndHistory: [{
        date: '2026-05-28',
        cycleId: 'c2',
        closeKind: 'backfill',
        removedFromPool: 483.87,
        toLooseMoney: 0,
        spent: 3500,
        dailyAllowance: 483.87,
      }],
    };
    const logs = [
      { date: '2026-05-28', spent: 3500, status: 'confirmed', cycleId: 'c2' },
    ];
    const pace = computeCyclePace(mayCycle, logs, budget, new Date(2026, 5, 18));
    expect(pace.pool).toBeCloseTo(15000 - 483.87, 2);
    expect(pace.spent).toBe(3500);
    expect(pace.remaining).toBeCloseTo(pace.pool - (3500 - 483.87), 2);
    expect(pace.dailyAllowance).toBeCloseTo(pace.remaining / 30, 2);
  });

  test('computeCyclePace subtracts escalating piggy backfill overspend across multiple days', () => {
    const mayCycle = {
      id: 'c2',
      status: 'active',
      startedAt: '2026-05-20',
      budgetAmount: 15000,
    };
    const spends = [500, 600, 700, 800, 900, 1000, 1200, 1350, 3500];
    /** @type {import('../../lib/schema').DayEndHistoryEntry[]} */
    const history = [];
    let poolRemoved = 0;
    let dayNum = 20;
    for (const spent of spends) {
      const unlogged = 31 - history.length;
      const daily = roundMoney(divideMoney(15000 - poolRemoved, unlogged));
      const date = `2026-05-${String(dayNum).padStart(2, '0')}`;
      history.push({
        date,
        cycleId: 'c2',
        closeKind: 'backfill',
        removedFromPool: daily,
        toLooseMoney: roundMoney(Math.max(0, daily - spent)),
        spent,
        dailyAllowance: daily,
      });
      poolRemoved += daily;
      dayNum += 1;
    }
    const budget = { dayEndHistory: history, rolloverBalance: 0 };
    const logs = history.map((e) => ({
      date: e.date,
      spent: e.spent,
      status: 'confirmed',
      cycleId: 'c2',
    }));
    const pace = computeCyclePace(mayCycle, logs, budget, new Date(2026, 5, 18));
    const overspend = history.reduce(
      (sum, e) => sum + Math.max(0, (Number(e.spent) || 0) - (Number(e.removedFromPool) || 0)),
      0,
    );
    expect(pace.spent).toBe(10550);
    expect(pace.pool).toBeCloseTo(15000 - poolRemoved, 2);
    expect(pace.remaining).toBeCloseTo(pace.pool - overspend, 2);
    expect(pace.remaining).toBeLessThan(pace.pool);
  });

  test('computeCyclePace subtracts only open-day spend when one backfill day is jarred', () => {
    const mayCycle = {
      id: 'c2',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    const budget = {
      rolloverBalance: 0,
      dayEndHistory: [{
        date: '2026-05-19',
        cycleId: 'c2',
        closeKind: 'backfill',
        removedFromPool: 483.87,
        toLooseMoney: 283.87,
        spent: 200,
        dailyAllowance: 483.87,
      }],
    };
    const logs = [
      { date: '2026-05-19', spent: 200, status: 'confirmed', cycleId: 'c2' },
      { date: '2026-06-18', spent: 150, status: 'confirmed', cycleId: 'c2' },
    ];
    const pace = computeCyclePace(mayCycle, logs, budget, new Date(2026, 5, 18));
    expect(pace.remaining).toBe(pace.pool - 150);
  });

  test('computeCycleCloseBalance has no deficit when only open-day spend exceeds pool slice', () => {
    const mayCycle = {
      id: 'c2',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    /** @type {import('../../lib/schema').DayEndHistoryEntry[]} */
    const history = [];
    let poolRemoved = 0;
    let d = '2026-05-19';
    while (d <= '2026-06-17') {
      const unlogged = 31 - history.length;
      const daily = roundMoney(divideMoney(15000 - poolRemoved, unlogged));
      history.push({
        date: d,
        cycleId: 'c2',
        closeKind: 'backfill',
        removedFromPool: daily,
        toLooseMoney: daily - 200,
        spent: 200,
      });
      poolRemoved += daily;
      d = nextDay(d);
    }
    const budget = { dayEndHistory: history, rolloverBalance: 0 };
    const logs = [
      ...history.map((e) => ({
        date: e.date,
        spent: 200,
        status: 'confirmed',
        cycleId: 'c2',
      })),
      { date: '2026-06-18', spent: 200, status: 'confirmed', cycleId: 'c2' },
    ];
    const balance = computeCycleCloseBalance(
      mayCycle,
      logs,
      budget,
      '2026-06-18',
    );
    expect(balance.spentTotal).toBe(6200);
    expect(balance.deficit).toBe(0);
    expect(balance.surplus).toBeCloseTo(283.87, 2);
  });

  test('computeCyclePace spreads remaining over unlogged cycle days during spendingBoost backfill', () => {
    const mayCycle = {
      id: 'c2',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    const logs = [
      { date: '2026-05-19', spent: 200, status: 'confirmed', cycleId: 'c2' },
    ];
    const pace = computeCyclePace(mayCycle, logs, {}, new Date(2026, 5, 18));
    expect(pace.remaining).toBe(14800);
    expect(pace.remainingDays).toBe(30);
    expect(pace.dailyAllowance).toBeCloseTo(14800 / 30, 2);
  });

  test('computeCyclePace uses remaining for daily allowance when two spendingBoost backfill days are logged', () => {
    const mayCycle = {
      id: 'c2',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    const logs = [
      { date: '2026-05-19', spent: 200, status: 'confirmed', cycleId: 'c2' },
      { date: '2026-05-20', spent: 200, status: 'confirmed', cycleId: 'c2' },
    ];
    const pace = computeCyclePace(
      mayCycle,
      logs,
      { dailyJarDestination: 'spendingBoost' },
      new Date(2026, 5, 18),
    );
    expect(pace.pool).toBe(15000);
    expect(pace.spent).toBe(400);
    expect(pace.remaining).toBe(14600);
    expect(pace.remainingDays).toBe(29);
    expect(pace.dailyAllowance).toBeCloseTo(14600 / 29, 2);
  });

  test('computeCycleDailyAllowanceForDate uses unlogged days on that date', () => {
    const mayCycle = {
      id: 'c2',
      status: 'active',
      startedAt: '2026-05-19',
      budgetAmount: 15000,
    };
    const logs = [
      { date: '2026-05-19', spent: 200, status: 'confirmed', cycleId: 'c2' },
    ];
    const daily = computeCycleDailyAllowanceForDate(
      mayCycle,
      logs,
      '2026-05-19',
      {},
    );
    expect(daily).toBeCloseTo(14800 / 30, 2);
  });

  test('sumJarredInCycle dedupes duplicate dates', () => {
    const budget = {
      dayEndHistory: [
        { date: '2026-05-20', leftover: 100, toLooseMoney: 100, cycleId: 'c1' },
        { date: '2026-05-20', leftover: 200, toLooseMoney: 200, cycleId: 'c1' },
        { date: '2026-05-21', leftover: 50, toLooseMoney: 50, cycleId: 'c1' },
        { date: '2026-05-10', leftover: 999, toLooseMoney: 999 },
      ],
    };
    expect(sumJarredInCycle(budget, cycle)).toBe(250);
  });

  test('sumJarredInCycle ignores spendingBoost leftovers and foreign cycle rows', () => {
    const budget = {
      dayEndHistory: [
        { date: '2026-05-20', leftover: 500, cycleId: 'c1' },
        { date: '2026-05-21', leftover: 80, toLooseMoney: 80, cycleId: 'other' },
        { date: '2026-05-22', leftover: 60, toLooseMoney: 60, cycleId: 'c1' },
      ],
    };
    expect(sumJarredInCycle(budget, cycle)).toBe(60);
  });

  test('getEffectiveCycleJarred ignores pre-cycle jarredThisMonth', () => {
    expect(getEffectiveCycleJarred({ jarredThisMonth: 500 }, cycle)).toBe(0);
  });

  test('dedupeCycleDayEndHistory keeps one row per cycle date', () => {
    const budget = {
      dayEndHistory: [
        { date: '2026-05-10', leftover: 1 },
        { date: '2026-05-20', leftover: 100 },
        { date: '2026-05-20', leftover: 200 },
      ],
    };
    dedupeCycleDayEndHistory(budget, cycle);
    expect(budget.dayEndHistory).toHaveLength(2);
    expect(budget.dayEndHistory.find((e) => e.date === '2026-05-20').leftover).toBe(200);
  });

  test('capCycleLeftover prevents jarred + spent exceeding budget', () => {
    const budget = {
      rolloverBalance: 0,
      dayEndHistory: [
        { date: '2026-05-20', leftover: 12000, toLooseMoney: 12000, cycleId: 'c1' },
      ],
    };
    const logs = [
      { date: '2026-05-21', spent: 6400, status: 'confirmed', cycleId: 'c1' },
    ];
    const capped = capCycleLeftover({
      cycle,
      budget,
      logs,
      onDateIso: '2026-05-21',
      leftover: 500,
    });
    expect(capped).toBe(0);
  });

  test('multi-month cycle pace stays within budget envelope', () => {
    /** @type {import('../../lib/schema').DayEndHistoryEntry[]} */
    const history = [];
    let d = '2026-05-18';
    while (d <= '2026-06-17') {
      history.push({ date: d, leftover: 100, dailyAllowance: 200, spent: 100, toActivityJar: 100 });
      const [y, m, day] = d.split('-').map(Number);
      const next = new Date(y, m - 1, day + 1);
      d = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    }
    const budget = { rolloverBalance: 0, dayEndHistory: history };
    const logs = history.map((e) => ({
      date: e.date,
      spent: 200,
      status: 'confirmed',
      cycleId: 'c1',
    }));
    const pace = computeCyclePace(cycle, logs, budget, new Date(2026, 5, 18));
    expect(pace.remaining).toBeGreaterThanOrEqual(0);
    expect(pace.pool).toBeGreaterThanOrEqual(pace.spent);
  });
});
