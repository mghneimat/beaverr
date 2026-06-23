import { aggregateHouseholdCosts } from '../../lib/householdBudget';
import { totalMonthlyCosts } from '../../lib/finance';

const t = (key, params) => {
  if (key === 'onboarding.budget.familyContribution' && params?.n) {
    return `Family contribution ${params.n}`;
  }
  if (key.startsWith('onboarding.budget.budgetSplit.cat.')) {
    return key.split('.').pop();
  }
  if (key.startsWith('dashboard.recurring.')) {
    return key.split('.').pop();
  }
  return key;
};

describe('aggregateHouseholdCosts', () => {
  it('does not include family contributions for renting households', () => {
    const { allCosts } = aggregateHouseholdCosts({
      housing: {
        type: 'renting',
        rent: 10000,
        contributesToFamily: true,
        familyContributionRows: [{ amount: 10000, description: null }],
      },
      household: {},
    }, t);

    expect(allCosts.some((c) => c.label?.includes('Family contribution'))).toBe(false);
  });

  it('labels user health premium as self insurance, not child', () => {
    const { allCosts, byCategory } = aggregateHouseholdCosts({
      health: {
        user: { confirmed: true, coverage: 'private', premium: 1000, frequency: 'monthly' },
      },
      household: {},
    }, t);

    const healthItems = byCategory.find((c) => c.category === 'health')?.items || [];
    expect(healthItems).toHaveLength(1);
    expect(healthItems[0].label).toBe('healthSelf');
    expect(allCosts).toHaveLength(1);
  });

  it('amortizes prepaid health renewal over months remaining, not annual frequency', () => {
    const { byCategory } = aggregateHouseholdCosts({
      health: {
        user: {
          confirmed: true,
          coverage: 'private',
          premium: 12000,
          frequency: 'annual',
          endDateType: 'fixed',
          endDate: '12/2026',
          premiumPaidInFull: true,
          renewalPlan: 'renew',
          budgetForRenewal: true,
          renewalBudgetMode: 'custom',
          renewalCustomMonthly: 1500,
        },
      },
      household: {},
    }, t);

    const healthItems = byCategory.find((c) => c.category === 'health')?.items || [];
    expect(healthItems).toHaveLength(1);
    expect(healthItems[0].amount).toBe(1500);
    expect(healthItems[0].frequency).toBe('monthly');
  });

  it('excludes prepaid health premium when renewal budgeting is skipped', () => {
    const { byCategory } = aggregateHouseholdCosts({
      health: {
        user: {
          confirmed: true,
          coverage: 'private',
          premium: 12000,
          frequency: 'annual',
          endDateType: 'fixed',
          endDate: '12/2026',
          premiumPaidInFull: true,
          renewalPlan: 'renew',
          budgetForRenewal: false,
          renewalBudgetMode: 'skip',
        },
      },
      household: {},
    }, t);

    const healthItems = byCategory.find((c) => c.category === 'health')?.items || [];
    expect(healthItems).toHaveLength(0);
  });

  it('amortizes prepaid vehicle renewal reserve in transport costs', () => {
    const { byCategory } = aggregateHouseholdCosts({
      transport: {
        hasVehicle: true,
        vehicles: [{
          hasInsurance: true,
          insurancePremium: 22500,
          insuranceFrequency: 'annual',
          insuranceEndDateType: 'fixed',
          insuranceEndDate: '12/2026',
          insurancePremiumPaidInFull: true,
          insuranceRenewalPlan: 'renew',
          insuranceBudgetForRenewal: true,
          insuranceRenewalBudgetMode: 'custom',
          insuranceRenewalCustomMonthly: 1875,
        }],
      },
      household: {},
    }, t);

    const transportItems = byCategory.find((c) => c.category === 'transport')?.items || [];
    expect(transportItems).toHaveLength(1);
    expect(transportItems[0].label).toBe('Insurance');
    expect(transportItems[0].amount).toBe(1875);
    expect(transportItems[0].frequency).toBe('monthly');
  });

  it('ignores stale child health entries when household has no children', () => {
    const { byCategory } = aggregateHouseholdCosts({
      health: {
        user: { confirmed: true, coverage: 'private', premium: 500, frequency: 'monthly' },
        child_0: { confirmed: true, coverage: 'private', premium: 1000, frequency: 'monthly' },
      },
      household: { children: [] },
    }, t);

    const healthItems = byCategory.find((c) => c.category === 'health')?.items || [];
    expect(healthItems).toHaveLength(1);
    expect(healthItems[0].amount).toBe(500);
  });

  it('tolerates non-array otherCosts without throwing', () => {
    expect(() => aggregateHouseholdCosts({ otherCosts: {}, household: {} }, t)).not.toThrow();
    const { allCosts } = aggregateHouseholdCosts({ otherCosts: {}, household: {} }, t);
    expect(allCosts).toEqual([]);
  });

  it('aggregates children costs from Czech-formatted amount strings with translated labels', () => {
    const tFull = (key) => {
      if (key === 'onboarding.childrenCosts.childrenCosts.sources.schoolSupplies') return 'School supplies';
      if (key === 'onboarding.budget.budgetSplit.cat.children') return 'children';
      return t(key);
    };

    const { byCategory, allCosts } = aggregateHouseholdCosts({
      childrenCosts: {
        child_0: {
          schoolSupplies: { amount: '800,00', frequency: 'monthly' },
          schoolFees: { amount: '1 200,50', frequency: 'monthly' },
        },
      },
      household: { children: [{ ageGroup: '6-15' }] },
    }, tFull);

    const childrenItems = byCategory.find((c) => c.category === 'children')?.items || [];
    expect(childrenItems).toHaveLength(2);
    expect(childrenItems[0].label).toBe('School supplies');
    expect(childrenItems[0].amount).toBe(800);
    expect(childrenItems[1].amount).toBe(1200.5);
    expect(totalMonthlyCosts(allCosts)).toBeCloseTo(2000.5, 2);
  });
});
