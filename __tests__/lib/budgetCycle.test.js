import {
  loadCycleStore,
  saveCycleStore,
  startBudgetCycle,
  closeBudgetCycle,
  getActiveCycle,
  getClosedCycles,
  getLastClosedCycle,
  missingDaysInCycle,
  isCycleBackfillPending,
  sumSpentInCycle,
} from '../../lib/budgetCycle';
import { computeCyclePace, resolvePaceStatus, paceColor, computeCyclePool } from '../../lib/cyclePace';
import {
  normalizeDailyLogEntry,
  upsertDailyLog,
  sumSpentOnDate,
} from '../../lib/dailyLog';

jest.mock('../../lib/storage', () => {
  let store = {};
  return {
    getData: jest.fn((key) => Promise.resolve(store[key] ?? null)),
    setData: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    __resetStore: () => {
      store = {};
    },
  };
});

const { __resetStore } = require('../../lib/storage');

describe('budgetCycle', () => {
  beforeEach(async () => {
    __resetStore();
    await saveCycleStore({ cycles: [], activeCycleId: null });
  });

  test('cycle store helpers tolerate null store', () => {
    expect(getActiveCycle(null)).toBeNull();
    expect(getClosedCycles(null)).toEqual([]);
    expect(getLastClosedCycle(null)).toBeNull();
  });

  test('startBudgetCycle creates active cycle', async () => {
    const cycle = await startBudgetCycle({
      startedAt: '2026-06-01',
      budgetAmount: 20000,
    });
    expect(cycle.status).toBe('active');
    expect(cycle.budgetAmount).toBe(20000);
    const store = await loadCycleStore();
    expect(store.activeCycleId).toBe(cycle.id);
    expect(getActiveCycle(store)?.id).toBe(cycle.id);
  });

  test('sumSpentInCycle counts only confirmed logs in range', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-06-01',
      budgetAmount: 10000,
    };
    const logs = [
      { date: '2026-06-01', spent: 100, status: 'confirmed', cycleId: 'c1' },
      { date: '2026-06-02', spent: null, status: 'unset', cycleId: 'c1' },
      { date: '2026-06-03', spent: 50, status: 'confirmed', cycleId: 'c1' },
    ];
    expect(sumSpentInCycle(cycle, logs, '2026-06-03')).toBe(150);
  });

  test('missingDaysInCycle finds unset days', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-06-10',
      budgetAmount: 10000,
    };
    const logs = [
      { date: '2026-06-10', spent: 0, status: 'confirmed', cycleId: 'c1' },
    ];
    const now = new Date(2026, 5, 12);
    const missing = missingDaysInCycle(cycle, logs, undefined, now);
    expect(missing).toContain('2026-06-11');
    expect(missing).not.toContain('2026-06-10');
  });

  test('isCycleBackfillPending when cycle started in past with unset days', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-06-10',
      budgetAmount: 10000,
    };
    const logs = [
      { date: '2026-06-10', spent: 0, status: 'confirmed', cycleId: 'c1' },
    ];
    const now = new Date(2026, 5, 12);
    expect(isCycleBackfillPending(cycle, logs, now)).toBe(true);
  });

  test('isCycleBackfillPending false when cycle starts today', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-06-12',
      budgetAmount: 10000,
    };
    const now = new Date(2026, 5, 12);
    expect(isCycleBackfillPending(cycle, [], now)).toBe(false);
  });

  test('isCycleBackfillPending false when all past days logged', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-06-10',
      budgetAmount: 10000,
    };
    const logs = [
      { date: '2026-06-10', spent: 100, status: 'confirmed', cycleId: 'c1' },
      { date: '2026-06-11', spent: 50, status: 'confirmed', cycleId: 'c1' },
    ];
    const now = new Date(2026, 5, 12);
    expect(isCycleBackfillPending(cycle, logs, now)).toBe(false);
  });

  test('closeBudgetCycle closes and optionally starts next', async () => {
    const cycle = await startBudgetCycle({
      startedAt: '2026-06-01',
      budgetAmount: 10000,
    });
    const { closed, next } = await closeBudgetCycle({
      cycleId: cycle.id,
      closedAt: '2026-06-28',
      spentTotal: 9000,
      nextCycle: { startedAt: '2026-06-29', budgetAmount: 10000 },
    });
    expect(closed.status).toBe('closed');
    expect(closed.surplus).toBe(1000);
    expect(next?.status).toBe('active');
    const store = await loadCycleStore();
    expect(store.activeCycleId).toBe(next?.id);
  });
});

describe('cyclePace', () => {
  test('resolvePaceStatus thresholds', () => {
    expect(resolvePaceStatus(0.5, 5000)).toBe('ok');
    expect(resolvePaceStatus(0.92, 800)).toBe('warning');
    expect(resolvePaceStatus(1, 0)).toBe('exhausted');
    expect(resolvePaceStatus(1.1, -100)).toBe('deficit');
  });

  test('computeCyclePace returns critical pace when spend far ahead of elapsed time', () => {
    const cycle = {
      id: 'c1',
      status: 'active',
      startedAt: '2026-06-01',
      budgetAmount: 10000,
    };
    const logs = [
      { date: '2026-06-01', spent: 9000, status: 'confirmed', cycleId: 'c1' },
    ];
    const now = new Date(2026, 5, 1);
    const pace = computeCyclePace(cycle, logs, {}, now);
    expect(pace.paceLevel).toBe('critical');
    expect(pace.color).toBe(paceColor('critical'));
  });

  test('computeCyclePool applies pool adjustments on date', () => {
    const cycle = { id: 'c1', budgetAmount: 10000 };
    const adjustments = [
      {
        id: 'a1',
        cycleId: 'c1',
        kind: 'income',
        amount: 2000,
        label: 'Bonus',
        timing: 'immediate',
        paymentDate: '2026-06-01',
        funding: 'cycleBudget',
        status: 'active',
        createdAt: '2026-06-01',
      },
      {
        id: 'a2',
        cycleId: 'c1',
        kind: 'expense',
        amount: 3000,
        label: 'Repair',
        timing: 'scheduled',
        paymentDate: '2026-06-15',
        funding: 'cycleBudget',
        status: 'active',
        createdAt: '2026-06-01',
      },
      {
        id: 'a3',
        cycleId: 'c1',
        kind: 'expense',
        amount: 500,
        label: 'Card',
        timing: 'immediate',
        paymentDate: '2026-06-01',
        funding: 'elsewhere',
        status: 'active',
        createdAt: '2026-06-01',
      },
    ];
    expect(computeCyclePool(cycle, {}, adjustments, '2026-06-10').pool).toBe(9000);
    expect(computeCyclePool(cycle, {}, adjustments, '2026-06-20').pool).toBe(6000);
  });
});

describe('dailyLog tri-state', () => {
  test('normalizeDailyLogEntry migrates legacy rows', () => {
    expect(normalizeDailyLogEntry({ date: '2026-01-01', spent: 100 }).status).toBe('confirmed');
    expect(normalizeDailyLogEntry({ date: '2026-01-01', spent: 0 }).status).toBe('confirmed');
  });

  test('upsertDailyLog keeps confirmed zero', () => {
    const next = upsertDailyLog([], '2026-01-01', 0, { confirmZero: true, cycleId: 'c1' });
    expect(next[0].status).toBe('confirmed');
    expect(next[0].spent).toBe(0);
    expect(sumSpentOnDate(next, '2026-01-01')).toBe(0);
  });

  test('upsertDailyLog removes entry when zero without confirmZero', () => {
    const seeded = upsertDailyLog([], '2026-01-01', 50, { confirmZero: true });
    const next = upsertDailyLog(seeded, '2026-01-01', 0);
    expect(next.length).toBe(0);
  });
});
