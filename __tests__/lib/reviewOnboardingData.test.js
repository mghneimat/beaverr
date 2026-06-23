import {
  buildReviewFinancials,
  buildSectionRows,
  buildSectionSubtitle,
  buildChildrenBlocks,
  sectionHasEnteredData,
  sectionHasWarning,
  filterVisibleReviewSections,
} from '../../lib/reviewOnboardingData';

const t = (key) => {
  const suffixes = {
    'onboarding.review.review.format.perMonth': '/month',
    'onboarding.review.review.format.perWeek': '/week',
    'onboarding.review.review.format.perDay': '/day',
    'onboarding.review.review.format.perFortnight': '/fortnight',
    'onboarding.review.review.format.perQuarter': '/quarter',
    'onboarding.review.review.format.perYear': '/year',
    'onboarding.review.review.format.listSeparator': ' · ',
  };
  return suffixes[key] ?? key;
};

function makeCtx(allData) {
  const financials = buildReviewFinancials(allData, t);
  return { allData, financials, t };
}

describe('sectionHasEnteredData', () => {
  it('hides transport when no vehicle and no public transport costs', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_transport: { hasVehicle: false, hasPublicTransport: false },
    };
    const ctx = makeCtx(allData);
    expect(sectionHasEnteredData('transport', ctx)).toBe(false);
  });

  it('shows transport when fuel cost is entered', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_transport: { hasVehicle: true, fuelCost: 2500 },
    };
    const ctx = makeCtx(allData);
    expect(sectionHasEnteredData('transport', ctx)).toBe(true);
  });

  it('hides subscriptions without amounts', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_subscriptions: [{ name: 'netflix', cost: 0 }],
    };
    const ctx = makeCtx(allData);
    expect(sectionHasEnteredData('subscriptions', ctx)).toBe(false);
  });

  it('shows subscriptions with a cost', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_subscriptions: [{ name: 'netflix', cost: 299 }],
    };
    const ctx = makeCtx(allData);
    expect(sectionHasEnteredData('subscriptions', ctx)).toBe(true);
  });

  it('hides children costs when children have no amounts', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_household: { children: [{ displayName: 'Adam' }] },
      beaverr_children_costs: { child_0: { kindergarten: { amount: 0 } } },
    };
    const ctx = makeCtx(allData);
    expect(sectionHasEnteredData('childrenCosts', ctx)).toBe(false);
  });
});

describe('filterVisibleReviewSections', () => {
  it('omits empty optional expense sections', () => {
    const allData = {
      beaverr_household: { type: 'couple' },
      beaverr_location: { city: 'Prague', currency: 'CZK' },
      beaverr_budget: { monthlyFlexible: 5000 },
      beaverr_income: { amount: 62000, frequency: 'monthly' },
      beaverr_health: { user: { confirmed: true, coverage: 'employer' } },
      beaverr_transport: { hasVehicle: false, hasPublicTransport: false },
      beaverr_subscriptions: [],
      beaverr_other_costs: [],
      beaverr_pets: [],
      beaverr_debts: [],
    };
    const ctx = makeCtx(allData);
    const ids = filterVisibleReviewSections(allData, ctx).map((section) => section.id);
    expect(ids).not.toContain('transport');
    expect(ids).not.toContain('subscriptions');
    expect(ids).toContain('household');
    expect(ids).toContain('income');
  });
});

describe('buildSectionRows', () => {
  it('location permit rows use unique React keys while sharing edit focus', () => {
    const allData = {
      beaverr_location: {
        country: 'CZ',
        city: 'Prague',
        currency: 'CZK',
        residencePermit: { type: 'employeeCard', endDate: '15/06/2028' },
      },
    };
    const ctx = makeCtx(allData);
    const rows = buildSectionRows('location', ctx);
    const keys = rows.map((row) => row.key);
    expect(new Set(keys).size).toBe(keys.length);
    const permitRows = rows.filter((row) => row.editKey === 'residencePermit');
    expect(permitRows).toHaveLength(2);
    expect(permitRows.map((row) => row.key)).toEqual([
      'location:residencePermit',
      'location:residencePermitEnd',
    ]);
  });
});

describe('buildSectionSubtitle', () => {
  it('children costs subtitle shows summed monthly total, not per-child parts', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_household: {
        children: [{ displayName: 'Adam' }, { displayName: 'Anna' }],
      },
      beaverr_children_costs: {
        child_0: { kindergarten: { amount: 999, frequency: 'monthly' } },
        child_1: { schoolFees: { amount: 1443, frequency: 'monthly' } },
      },
    };
    const ctx = makeCtx(allData);
    expect(buildSectionSubtitle('childrenCosts', ctx)).toBe('2 442,00 CZK/month');
  });

  it('income section omits duplicate total when only one source', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_income: { amount: 62000, frequency: 'monthly' },
    };
    const ctx = makeCtx(allData);
    const rows = buildSectionRows('income', ctx);
    expect(rows.filter((row) => row.key === 'income:totalIncome')).toHaveLength(0);
    expect(rows.find((row) => row.key === 'income:userIncome')?.value).toBe('62 000,00 CZK/month');
  });

  it('income section shows total when multiple sources', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_income: {
        amount: 62000,
        frequency: 'monthly',
        partnerAmount: 30000,
        partnerFrequency: 'monthly',
      },
    };
    const ctx = makeCtx(allData);
    const rows = buildSectionRows('income', ctx);
    expect(rows.filter((row) => row.key === 'income:totalIncome')).toHaveLength(1);
    expect(rows.find((row) => row.key === 'income:totalIncome')?.value).toBe('92 000,00 CZK/month');
  });

  it('health private with zero premium shows Private, not raw frequency suffix', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_health: {
        partner: {
          confirmed: true,
          coverage: 'private',
          premium: '0',
          frequency: 'custom',
          customFrequencyMonths: '6',
        },
      },
    };
    const ctx = makeCtx(allData);
    const rows = buildSectionRows('health', ctx);
    expect(rows.find((row) => row.key === 'health:partner')?.value).toBe('onboarding.review.review.labels.private');
  });

  it('health custom premium formats as every N months when budget line is zero', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_health: {
        partner: {
          confirmed: true,
          coverage: 'private',
          premium: '1200',
          frequency: 'custom',
          customFrequencyMonths: '6',
        },
      },
    };
    const ctx = makeCtx(allData);
    const rows = buildSectionRows('health', ctx);
    expect(rows.find((row) => row.key === 'health:partner')?.value).toBe('200,00 CZK/month');
  });

  it('children cost rows parse Czech-formatted stored amounts', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_household: { children: [{ displayName: 'Adam' }] },
      beaverr_children_costs: {
        child_0: {
          schoolSupplies: { amount: '800,00', frequency: 'monthly' },
          schoolFees: { amount: '199,00', frequency: 'monthly' },
        },
      },
    };
    const ctx = makeCtx(allData);
    const blocks = buildChildrenBlocks(ctx);
    expect(blocks[0].rows[0].value).toBe('800,00 CZK/month');
    expect(blocks[0].rows[1].value).toBe('199,00 CZK/month');
  });

  it('health subtitle warns when members skipped insurance', () => {
    const allData = {
      beaverr_location: { currency: 'CZK' },
      beaverr_household: { children: [{ displayName: 'Adam' }, { displayName: 'Anna' }] },
      beaverr_health: {
        user: { confirmed: true, coverage: 'employer' },
        partner: { confirmed: true, coverage: 'private', premium: '24000', frequency: 'custom', customFrequencyMonths: '24' },
        child_0: { confirmed: false, skipped: true },
        child_1: { confirmed: false, skipped: true },
      },
    };
    const ctx = makeCtx(allData);
    expect(buildSectionSubtitle('health', ctx)).toBe('onboarding.review.review.subtitles.healthSkipped');
    expect(sectionHasWarning('health', ctx.financials)).toBe(true);
  });
});
