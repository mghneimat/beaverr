import {
  resolveHousingContinue,
  resolveHousingBack,
  buildHousingPayload,
} from '../../lib/housing/housingFlow';

describe('resolveHousingContinue', () => {
  const base = {
    utilitiesMode: 'total',
    utilitiesItemStep: 'select',
    utilitySelections: [],
    rentAmount: '15000',
    hasInternet: false,
    internetAmount: '',
    hasMortgage: false,
    mortgageAmount: '',
    hasOtherCosts: false,
    otherCostRows: [],
    contributesToFamily: false,
    familyContributionRows: [],
  };

  it('requires housing type on first step', () => {
    expect(resolveHousingContinue({ ...base, step: 'housing-status', housingType: null }).type)
      .toBe('validationError');
  });

  it('routes renting to rent-details', () => {
    const result = resolveHousingContinue({ ...base, step: 'housing-status', housingType: 'renting' });
    expect(result).toEqual({ type: 'nextStep', step: 'rent-details' });
  });

  it('completes on govt-taxes', () => {
    expect(resolveHousingContinue({ ...base, step: 'govt-taxes', housingType: 'renting' }).type)
      .toBe('complete');
  });
});

describe('resolveHousingBack', () => {
  it('leaves section from first step', () => {
    expect(resolveHousingBack({
      step: 'housing-status',
      housingType: null,
      utilitiesMode: 'total',
      utilitiesItemStep: 'select',
      utilitySelections: [],
      activeUtilityIdx: 0,
      hasMortgage: false,
    }).type).toBe('leaveSection');
  });
});

describe('buildHousingPayload', () => {
  it('serializes rent and utilities', () => {
    const payload = buildHousingPayload({
      housingType: 'renting',
      rentAmount: '12000',
      rentEndDate: '',
      rentDueDate: '',
      rentChargeDay: '',
      utilitiesMode: 'total',
      utilitiesAmount: '3000',
      utilitiesFrequency: 'monthly',
      utilitySelections: [],
      hasInternet: false,
      internetAmount: '',
      internetFrequency: 'monthly',
      internetEndDate: '',
      internetDueDate: '',
      internetChargeDay: '',
      hasMortgage: false,
      mortgageAmount: '',
      mortgageEndDate: '',
      hasOtherCosts: false,
      otherCostRows: [],
      contributesToFamily: false,
      familyContributionRows: [],
      wasteTax: true,
      wasteTaxAmount: '1080',
      wasteTaxUserEdited: false,
      location: null,
      household: null,
      tvLicence: true,
      tvLicenceAmount: '1620',
      radioLicence: true,
      radioLicenceAmount: '540',
      customTaxItems: [],
    });
    expect(payload.rent).toBe(12000);
    expect(payload.utilities).toBe(3000);
  });
});
