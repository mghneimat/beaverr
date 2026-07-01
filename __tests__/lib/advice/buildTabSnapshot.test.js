import { buildTabSnapshot } from '../../../lib/advice/buildTabSnapshot';
import { evaluateTabAdviceRules } from '../../../lib/advice/evaluateTabAdviceRules';

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
  byCategory: [
    {
      category: 'housing',
      items: [{ label: 'Rent', amount: 20000, frequency: 'monthly' }],
    },
  ],
  sections: { household: { type: 'partner' }, health: {} },
  financialRisks: [],
  budget: { cyclesEnabled: true, rolloverStrategy: 'free' },
  dailyLogs: [],
  cycleStore: { cycles: [], activeCycleId: null },
};

const PII_KEYS = ['name', 'email', 'account', 'iban', 'label'];

function assertNoPii(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;
  Object.entries(obj).forEach(([key, value]) => {
    const nextPath = path ? `${path}.${key}` : key;
    expect(PII_KEYS.some((pii) => key.toLowerCase().includes(pii))).toBe(false);
    if (value && typeof value === 'object') {
      assertNoPii(value, nextPath);
    }
  });
}

describe('buildTabSnapshot', () => {
  const tabKeys = ['home', 'income', 'expenses', 'budget', 'savings', 'goals', 'tracker', 'summary', 'alerts'];

  it.each(tabKeys)('builds privacy-safe snapshot for %s', (tabKey) => {
    const { snapshot } = buildTabSnapshot(tabKey, {
      financials: baseFinancials,
      locale: 'en',
      helpers: {
        goals: [{ lifecycleStatus: 'active', paceStatus: 'on_track' }],
        alerts: [{ status: 'active', urgency: 'medium' }],
        savingsBalance: 12000,
      },
    });

    expect(snapshot.tab_key).toBe(tabKey === 'home' ? 'home' : tabKey);
    expect(snapshot.locale).toBe('en');
    assertNoPii(snapshot);
  });

  it('includes country_code from location in all tab snapshots', () => {
    const financials = {
      ...baseFinancials,
      sections: {
        ...baseFinancials.sections,
        location: { country: 'CZ' },
      },
    };

    const { snapshot: expenses } = buildTabSnapshot('expenses', {
      financials,
      locale: 'en',
    });
    expect(expenses.location).toEqual({ country_code: 'CZ' });

    const { snapshot: home } = buildTabSnapshot('home', {
      financials,
      locale: 'en',
    });
    expect(home.location).toEqual({ country_code: 'CZ' });
  });

  it('narrows expenses snapshot to committed totals and top categories', () => {
    const { snapshot } = buildTabSnapshot('expenses', {
      financials: baseFinancials,
      locale: 'en',
    });

    expect(snapshot.ledger.committed_m).toBeGreaterThan(0);
    expect(snapshot.ledger.income_m).toBe(50000);
    expect(Array.isArray(snapshot.categories)).toBe(true);
    expect(snapshot.categories[0]).toHaveProperty('category');
    expect(snapshot.categories[0]).not.toHaveProperty('label');
  });

  it('includes tracker cycle flags without log labels', () => {
    const { snapshot } = buildTabSnapshot('tracker', {
      financials: {
        ...baseFinancials,
        activeCycle: { id: 'c1', startedAt: '2026-06-01' },
        dailyLogs: [{ date: '2026-06-01', amount: 100 }],
      },
      locale: 'en',
    });

    expect(snapshot.tracker.has_active_cycle).toBe(true);
    expect(snapshot.tracker.daily_log_count).toBe(1);
    assertNoPii(snapshot.tracker);
  });
});

describe('evaluateTabAdviceRules', () => {
  it('fires tracker logging rule when days are unset', () => {
    const financials = {
      ...baseFinancials,
      activeCycle: {
        id: 'c1',
        startedAt: '2026-06-01',
        closedAt: null,
      },
      dailyLogs: [],
    };
    const { snapshot, ruleContext } = buildTabSnapshot('tracker', {
      financials,
      locale: 'en',
    });
    const rules = evaluateTabAdviceRules('tracker', snapshot, ruleContext);
    expect(rules.map((r) => r.id)).toContain('tracker_needs_logging');
  });

  it('fires goals behind pace rule', () => {
    const goals = [
      { lifecycleStatus: 'active', paceStatus: 'behind' },
      { lifecycleStatus: 'active', paceStatus: 'on_track' },
    ];
    const { snapshot, ruleContext } = buildTabSnapshot('goals', {
      financials: baseFinancials,
      locale: 'en',
      helpers: { goals },
    });
    const rules = evaluateTabAdviceRules('goals', snapshot, ruleContext);
    expect(rules.map((r) => r.id)).toContain('goals_behind_pace');
  });

  it('fires expenses overcommitted rule', () => {
    const overFinancials = {
      ...baseFinancials,
      totalIncome: 10000,
      fixedCosts: 12000,
      debtPayments: 0,
    };
    const { snapshot, ruleContext } = buildTabSnapshot('expenses', {
      financials: overFinancials,
      locale: 'en',
    });
    const rules = evaluateTabAdviceRules('expenses', snapshot, ruleContext);
    expect(rules.map((r) => r.id)).toContain('overcommitted');
  });

  it('fires household_overview when home tab has data but no warning rules', () => {
    const healthyFinancials = {
      ...baseFinancials,
      totalIncome: 80000,
      fixedCosts: 40000,
      debtPayments: 5000,
      monthlyFlexible: 25000,
      effectiveMonthlyFlexible: 25000,
      income: {
        amount: 50000,
        frequency: 'monthly',
        partnerAmount: 30000,
        partnerFrequency: 'monthly',
      },
      sections: { household: { type: 'partner' }, health: { items: [{ amount: 1000, frequency: 'monthly' }] } },
    };
    const { snapshot, ruleContext } = buildTabSnapshot('home', {
      financials: healthyFinancials,
      locale: 'en',
    });
    const rules = evaluateTabAdviceRules('home', snapshot, ruleContext);
    expect(rules.map((r) => r.id)).toContain('household_overview');
  });
});
