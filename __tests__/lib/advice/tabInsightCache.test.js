import {
  buildTabInsightSnapshotKey,
  clearTabInsightCache,
  clearTabInsightCacheForTab,
  readTabInsightCache,
  writeTabInsightCache,
} from '../../../lib/advice/tabInsightCache';

const baseFinancials = {
  totalIncome: 50000,
  fixedCosts: 30000,
  debtPayments: 5000,
  monthlyFlexible: 10000,
  effectiveMonthlyFlexible: 10000,
  availableBudget: 15000,
  currencyCode: 'CZK',
  income: { amount: 50000, frequency: 'monthly' },
  debts: [],
  byCategory: [],
  sections: { household: { type: 'partner' }, health: {} },
  financialRisks: [],
  budget: { cyclesEnabled: false },
  dailyLogs: [],
  cycleStore: { cycles: [], activeCycleId: null },
};

describe('tabInsightCache', () => {
  beforeEach(() => {
    clearTabInsightCache();
  });

  it('returns the same snapshot key for identical tab data', () => {
    const a = buildTabInsightSnapshotKey('income', baseFinancials, 'en');
    const b = buildTabInsightSnapshotKey('income', { ...baseFinancials }, 'en');
    expect(a).toBe(b);
  });

  it('changes snapshot key when tab data changes', () => {
    const before = buildTabInsightSnapshotKey('income', baseFinancials, 'en');
    const after = buildTabInsightSnapshotKey('income', {
      ...baseFinancials,
      totalIncome: 52000,
      income: { amount: 52000, frequency: 'monthly' },
    }, 'en');
    expect(before).not.toBe(after);
  });

  it('serves cached advice per tab until snapshot changes', () => {
    const snapshotKey = buildTabInsightSnapshotKey('home', baseFinancials, 'en');
    writeTabInsightCache('home', {
      snapshotKey,
      locale: 'en',
      paragraphs: ['Cached headline'],
      status: 'ready',
    });

    expect(readTabInsightCache('home', snapshotKey, 'en')).toEqual({
      snapshotKey,
      locale: 'en',
      paragraphs: ['Cached headline'],
      status: 'ready',
    });

    const changedKey = buildTabInsightSnapshotKey('home', {
      ...baseFinancials,
      totalIncome: 52000,
      income: { amount: 52000, frequency: 'monthly' },
    }, 'en');
    expect(readTabInsightCache('home', changedKey, 'en')).toBeNull();
  });

  it('keeps separate cache entries per tab', () => {
    const homeKey = buildTabInsightSnapshotKey('home', baseFinancials, 'en');
    const incomeKey = buildTabInsightSnapshotKey('income', baseFinancials, 'en');

    writeTabInsightCache('home', {
      snapshotKey: homeKey,
      locale: 'en',
      paragraphs: ['Home advice'],
      status: 'ready',
    });
    writeTabInsightCache('income', {
      snapshotKey: incomeKey,
      locale: 'en',
      paragraphs: ['Income advice'],
      status: 'ready',
    });

    expect(readTabInsightCache('home', homeKey, 'en')?.paragraphs[0]).toBe('Home advice');
    expect(readTabInsightCache('income', incomeKey, 'en')?.paragraphs[0]).toBe('Income advice');
  });

  it('clears only the requested tab on refresh', () => {
    const homeKey = buildTabInsightSnapshotKey('home', baseFinancials, 'en');
    const incomeKey = buildTabInsightSnapshotKey('income', baseFinancials, 'en');

    writeTabInsightCache('home', {
      snapshotKey: homeKey,
      locale: 'en',
      paragraphs: ['Home advice'],
      status: 'ready',
    });
    writeTabInsightCache('income', {
      snapshotKey: incomeKey,
      locale: 'en',
      paragraphs: ['Income advice'],
      status: 'ready',
    });

    clearTabInsightCacheForTab('home');

    expect(readTabInsightCache('home', homeKey, 'en')).toBeNull();
    expect(readTabInsightCache('income', incomeKey, 'en')?.paragraphs[0]).toBe('Income advice');
  });
});
