import {
  buildSinkingFundCandidates,
  syncSinkingFundStashes,
} from '../../lib/sinkingStashes';

const t = (key, params = {}) => {
  let out = key;
  Object.entries(params).forEach(([k, v]) => {
    out = out.replace(`{{${k}}}`, String(v));
  });
  return out;
};

const formatCurrency = (amount) => `${amount} CZK`;

describe('buildSinkingFundCandidates', () => {
  it('creates prepaid vehicle insurance candidate', () => {
    const now = new Date(2026, 5, 1);
    const candidates = buildSinkingFundCandidates({
      transport: {
        vehicles: [{
          id: 'v1',
          category: 'passenger',
          hasInsurance: true,
          insurancePremium: 12000,
          insuranceEndDateType: 'fixed',
          insuranceEndDate: '01/12/2026',
          insurancePremiumPaidInFull: true,
          insuranceRenewalPlan: 'renew',
          insuranceBudgetForRenewal: true,
        }],
      },
      household: null,
      location: {},
      health: {},
      childrenCosts: {},
      pets: [],
      subs: [],
    }, t, formatCurrency, now);

    const insurance = candidates.find((c) => c.sourceKey === 'vehicle_insurance:v1');
    expect(insurance).toBeDefined();
    expect(insurance.targetAmount).toBe(12000);
    expect(insurance.suggestedMonthly).toBeGreaterThan(0);
  });

  it('creates vignette candidate for motorcycles', () => {
    const now = new Date(2026, 5, 1);
    const candidates = buildSinkingFundCandidates({
      transport: {
        vehicles: [{
          id: 'm1',
          category: 'motorcycle',
          hasVignette: true,
          vignetteAmount: 1500,
          vignetteValidUntil: '31/03/2027',
        }],
      },
      household: null,
      location: {},
      health: {},
      childrenCosts: {},
      pets: [],
      subs: [],
    }, t, formatCurrency, now);

    expect(candidates.some((c) => c.sourceKey === 'vehicle_vignette:m1')).toBe(true);
  });

  it('creates annual subscription candidate', () => {
    const now = new Date(2026, 5, 1);
    const candidates = buildSinkingFundCandidates({
      subs: [{
        id: 'sub1',
        serviceKey: 'netflix',
        cost: 3000,
        frequency: 'annual',
        endDate: '01/06/2027',
      }],
      transport: { vehicles: [] },
      household: null,
      location: {},
      health: {},
      childrenCosts: {},
      pets: [],
    }, t, formatCurrency, now);

    expect(candidates.some((c) => c.sourceKey === 'subscription:sub1')).toBe(true);
  });

  it('names health insurance with partner name only once', () => {
    const now = new Date(2026, 5, 1);
    const candidates = buildSinkingFundCandidates({
      health: {
        partner: {
          premium: 6000,
          endDate: '01/12/2026',
          endDateType: 'fixed',
          premiumPaidInFull: true,
          renewalPlan: 'renew',
          budgetForRenewal: true,
        },
      },
      household: { partnerName: 'Jana', children: [] },
      transport: { vehicles: [] },
      location: {},
      childrenCosts: {},
      pets: [],
      subs: [],
    }, (key, params = {}) => {
      if (key === 'dashboard.savingsScreen.sinkingFund.healthInsuranceNamed') {
        return `${params.name}'s health insurance`;
      }
      return key;
    }, formatCurrency, now);

    const health = candidates.find((c) => c.sourceKey === 'health_insurance:partner');
    expect(health?.name).toBe("Jana's health insurance");
  });

  it('uses vehicle display name in MOT label', () => {
    const now = new Date(2026, 5, 1);
    const candidates = buildSinkingFundCandidates({
      transport: {
        vehicles: [{
          id: 'v1',
          category: 'passenger',
          displayName: 'Hyundai i30',
          motInspectionCost: 1500,
          motNextDate: '09/2028',
        }],
      },
      household: null,
      location: {},
      health: {},
      childrenCosts: {},
      pets: [],
      subs: [],
    }, (key, params = {}) => {
      if (key === 'dashboard.savingsScreen.sinkingFund.vehicleMot') {
        return `${params.vehicle} MOT/STK`;
      }
      return key;
    }, formatCurrency, now);

    const mot = candidates.find((c) => c.sourceKey === 'vehicle_mot:v1');
    expect(mot?.name).toBe('Hyundai i30 MOT/STK');
  });

  it('uses generic residence permit renewal label', () => {
    const now = new Date(2026, 5, 1);
    const candidates = buildSinkingFundCandidates({
      location: {
        isCzCitizen: false,
        residencePermit: {
          type: 'blueCard',
          endDate: '04/03/2027',
          renewalCost: 2500,
        },
      },
      household: null,
      transport: { vehicles: [] },
      health: {},
      childrenCosts: {},
      pets: [],
      subs: [],
    }, (key, params = {}) => {
      if (key === 'dashboard.savingsScreen.sinkingFund.residencePermit') {
        return `${params.holder} — ${params.renewal}`;
      }
      if (key === 'dashboard.savingsScreen.sinkingFund.residencePermitRenewal') {
        return 'Residence permit renewal';
      }
      if (key === 'dashboard.savingsScreen.sinkingFund.holderUser') return 'You';
      return key;
    }, formatCurrency, now);

    const permit = candidates.find((c) => c.sourceKey === 'residence_permit:user');
    expect(permit?.name).toBe('You — Residence permit renewal');
  });
});

describe('syncSinkingFundStashes', () => {
  it('creates and updates auto stashes by source key', () => {
    const now = new Date(2026, 5, 1);
    const sections = {
      transport: {
        vehicles: [{
          id: 'v1',
          category: 'passenger',
          hasVignette: true,
          vignetteAmount: 2000,
          vignetteValidUntil: '31/12/2026',
        }],
      },
      household: null,
      location: {},
      health: {},
      childrenCosts: {},
      pets: [],
      subs: [],
    };

    const first = syncSinkingFundStashes({}, sections, t, formatCurrency, now);
    expect(first.changed).toBe(true);
    expect(first.created).toBe(1);
    expect(first.budget.customStashes[0].autoCreated).toBe(true);
    expect(first.budget.customStashes[0].sinkingSourceKey).toBe('vehicle_vignette:v1');

    const second = syncSinkingFundStashes(first.budget, sections, t, formatCurrency, now);
    expect(second.created).toBe(0);
    expect(second.changed).toBe(false);
  });
});
