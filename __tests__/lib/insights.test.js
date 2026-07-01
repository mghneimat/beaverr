import {
  computeInsights,
  computeGoalGap,
  getHeadlineInsight,
  getBudgetSectionInsight,
  getTabInsight,
} from '../../lib/insights';

const t = (key, params = {}) => {
  let s = key;
  Object.entries(params).forEach(([k, v]) => {
    s = s.replace(`{{${k}}}`, String(v));
  });
  return s;
};

const baseFinancials = {
  totalIncome: 50000,
  fixedCosts: 30000,
  debtPayments: 5000,
  monthlyFlexible: 10000,
  availableBudget: 15000,
  income: { hasGoal: false },
  debts: [],
  byCategory: [
    { category: 'housing', label: 'Housing', items: [{ label: 'Rent', amount: 30000, frequency: 'monthly' }] },
    { category: 'subscriptions', label: 'Subscriptions', items: [{ label: 'Netflix', amount: 500, frequency: 'monthly' }] },
  ],
  sections: {
    subs: [
      { name: 'netflix', cost: '500', frequency: 'monthly' },
      { name: 'spotify', cost: '200', frequency: 'monthly' },
      { name: 'disneyPlus', cost: '300', frequency: 'monthly' },
    ],
    health: {},
    transport: {},
  },
  recurringCommitments: [],
};

describe('computeInsights', () => {
  test('calculates fixed cost ratio', () => {
    const insights = computeInsights({
      ...baseFinancials,
      recurringCommitments: [{ monthlyAmount: 1000 }],
    });
    expect(insights.fixedCostRatio).toBeCloseTo(0.7);
    expect(insights.topCategories[0].key).toBe('housing');
  });

  test('flags many streaming services', () => {
    const insights = computeInsights(baseFinancials);
    expect(insights.flags.manyStreaming).toBe(true);
    expect(insights.streamingCount).toBe(3);
  });
});

describe('computeGoalGap', () => {
  test('returns null when no goal', () => {
    expect(computeGoalGap(baseFinancials)).toBeNull();
  });

  test('detects unachievable goal', () => {
    const future = new Date();
    future.setMonth(future.getMonth() + 6);
    const day = String(future.getDate()).padStart(2, '0');
    const month = String(future.getMonth() + 1).padStart(2, '0');
    const fin = {
      ...baseFinancials,
      monthlyFlexible: 1000,
      income: {
        hasGoal: true,
        goalAmount: 50000,
        goalDate: `${day}/${month}/${future.getFullYear()}`,
        savingsBalance: 0,
      },
    };
    const gap = computeGoalGap(fin);
    expect(gap.achievable).toBe(false);
    expect(gap.monthlyRequired).toBeGreaterThan(1000);
  });
});

describe('getHeadlineInsight', () => {
  test('returns headline key text', () => {
    const insights = computeInsights(baseFinancials);
    const text = getHeadlineInsight(insights, t);
    expect(text).toContain('dashboard.insights.headline');
  });
});

describe('getBudgetSectionInsight', () => {
  test('returns lead, detail, and action for healthy budget', () => {
    const insights = computeInsights(baseFinancials);
    const result = getBudgetSectionInsight(insights, t, (n) => `${n} Kč`);
    expect(result).not.toBeNull();
    expect(result.lead).toContain('dashboard.insights.sections.budget');
    expect(result.detail).toContain('Housing');
    expect(result.route).toBe('costs');
  });

  test('returns review budget action when surplus is negative', () => {
    const insights = computeInsights({
      ...baseFinancials,
      monthlyFlexible: 20000,
      availableBudget: 15000,
    });
    const result = getBudgetSectionInsight(insights, t, (n) => `${n} Kč`);
    expect(result.route).toBe('budget');
    expect(result.ctaKey).toBe('dashboard.insights.actions.reviewBudget');
  });
});

describe('getTabInsight', () => {
  // Deprecated in UI — TabInsightCard uses cloud advice; kept for internal/rule signals until fully removed.
  test('returns savings empty copy when balance is zero', () => {
    const insights = computeInsights(baseFinancials);
    const result = getTabInsight('savings', insights, t, {
      savingsBalance: 0,
      financials: baseFinancials,
      formatAmount: (n) => `${n} Kč`,
    });
    expect(result.paragraphs[0]).toContain('dashboard.insights.sections.savings.empty');
  });

  test('returns savings inflow copy when balance and monthly inflow exist', () => {
    const insights = computeInsights({
      ...baseFinancials,
      income: {
        hasGoal: true,
        goalType: 'ongoing_savings',
        savingsMonthlyTarget: 2000,
      },
    });
    const result = getTabInsight('savings', insights, t, {
      savingsBalance: 5000,
      financials: {
        ...baseFinancials,
        income: {
          hasGoal: true,
          goalType: 'ongoing_savings',
          savingsMonthlyTarget: 2000,
        },
      },
      formatAmount: (n) => `${n} Kč`,
    });
    expect(result.paragraphs[0]).toContain('dashboard.insights.sections.savings.withInflow');
  });

  test('returns tracker empty copy when no logs exist', () => {
    const result = getTabInsight('tracker', {}, t, {
      financials: { budget: {}, dailyLogs: [] },
    });
    expect(result.paragraphs[0]).toContain('dashboard.insights.sections.tracker.empty');
  });

  test('returns alerts summary for active alerts', () => {
    const result = getTabInsight('alerts', {}, t, {
      alerts: [
        { status: 'active', urgency: 'high' },
        { status: 'active', urgency: 'low' },
        { status: 'dismissed', urgency: 'high' },
      ],
    });
    expect(result.paragraphs[0]).toContain('dashboard.insights.sections.alerts.summary');
  });

  test('returns budget paragraphs and CTA via tab key', () => {
    const insights = computeInsights(baseFinancials);
    const result = getTabInsight('budget', insights, t, {
      formatAmount: (n) => `${n} Kč`,
    });
    expect(result.paragraphs.length).toBeGreaterThan(0);
    expect(result.ctaLabel).toContain('dashboard.insights.actions');
    expect(result.route).toBeTruthy();
  });
});
