import { computeInsights, getTabInsight } from '../../lib/insights';

/**
 * TabInsightCard data path — synchronous rule-based copy, no loading/consent.
 */
const t = (key, params = {}) => {
  let s = key;
  Object.entries(params).forEach(([k, v]) => {
    s = s.replace(`{{${k}}}`, String(v));
  });
  return s;
};

const baseFinancials = {
  totalIncome: 50000,
  fixedCosts: 42000,
  debtPayments: 5000,
  monthlyFlexible: 3000,
  availableBudget: 3000,
  income: { hasGoal: false },
  debts: [],
  byCategory: [
    { category: 'housing', label: 'Housing', items: [{ label: 'Rent', amount: 30000, frequency: 'monthly' }] },
  ],
  sections: { subs: [], health: {}, transport: {} },
  recurringCommitments: [],
};

const TAB_KEYS = [
  'home',
  'income',
  'expenses',
  'budget',
  'savings',
  'goals',
  'tracker',
  'summary',
  'alerts',
];

describe('TabInsightCard data path', () => {
  test('each dashboard tab resolves getTabInsight without async state', () => {
    const insights = computeInsights(baseFinancials);

    for (const tabKey of TAB_KEYS) {
      const result = getTabInsight(tabKey, insights, t, {
        formatAmount: (n) => `${n} Kč`,
        financials: baseFinancials,
        savingsBalance: 0,
        goals: [],
        alerts: [],
      });
      expect(result).toBeTruthy();
      expect(Array.isArray(result.paragraphs)).toBe(true);
    }
  });

  test('tight fixed-cost ratio produces headline-style copy on budget tab', () => {
    const insights = computeInsights(baseFinancials);
    const result = getTabInsight('budget', insights, t, {
      formatAmount: (n) => `${n} Kč`,
    });
    expect(result.paragraphs.length).toBeGreaterThan(0);
    expect(result.paragraphs.join(' ')).toContain('dashboard.insights');
  });
});
