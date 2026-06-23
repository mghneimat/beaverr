import {
  getFirstFamilyPermitEndDate,
  getNonCitizenPermitChain,
  shouldRevealChildrenCitizenship,
  validateCitizenshipDraft,
  getResidencePermitBackRoute,
  getOccupationBackRoute,
} from '../../lib/citizenshipFlow';

describe('getFirstFamilyPermitEndDate', () => {
  const location = {
    residencePermit: { type: 'employeeCard', endDate: '15/06/2028', renewalCost: 5000 },
    partnerResidencePermit: { type: 'familyReunion', endDate: '01/01/2029', renewalCost: 3000 },
    childrenCitizenship: [
      { isCzCitizen: false, residencePermit: { type: 'other', endDate: '20/12/2027', renewalCost: 1000 } },
      { isCzCitizen: false, residencePermit: null },
    ],
  };

  it('returns null for the primary user', () => {
    expect(getFirstFamilyPermitEndDate(location, 'user')).toBeNull();
  });

  it('returns user end date for partner', () => {
    expect(getFirstFamilyPermitEndDate(location, 'partner')).toBe('15/06/2028');
  });

  it('returns first available end date for child 0 (user before partner)', () => {
    expect(getFirstFamilyPermitEndDate(location, 'child', 0)).toBe('15/06/2028');
  });

  it('returns first available end date for child 1 including earlier child', () => {
    expect(getFirstFamilyPermitEndDate(location, 'child', 1)).toBe('15/06/2028');
  });

  it('falls back to partner when user has no end date', () => {
    const loc = {
      residencePermit: null,
      partnerResidencePermit: { endDate: '01/03/2030' },
    };
    expect(getFirstFamilyPermitEndDate(loc, 'child', 0)).toBe('01/03/2030');
  });

  it('uses earlier child permit when user and partner have none', () => {
    const loc = {
      childrenCitizenship: [
        { residencePermit: { endDate: '10/10/2026' } },
      ],
    };
    expect(getFirstFamilyPermitEndDate(loc, 'child', 1)).toBe('10/10/2026');
  });
});

const householdWithPartner = {
  type: 'partner',
  partnerName: 'Sarah',
  children: [
    { displayName: 'Adam', ageGroup: '6-15' },
    { displayName: 'Leo', ageGroup: '3-5' },
  ],
};

describe('shouldRevealChildrenCitizenship', () => {
  it('hides children until all adults answered', () => {
    expect(shouldRevealChildrenCitizenship(
      { user: false, partner: null, children: [] },
      householdWithPartner,
    )).toBe(false);
  });

  it('reveals children when both adults answered and one is non-citizen', () => {
    expect(shouldRevealChildrenCitizenship(
      { user: false, partner: true, children: [] },
      householdWithPartner,
    )).toBe(true);
  });

  it('keeps children hidden when both adults are citizens', () => {
    expect(shouldRevealChildrenCitizenship(
      { user: true, partner: true, children: [] },
      householdWithPartner,
    )).toBe(false);
  });
});

describe('validateCitizenshipDraft', () => {
  const t = (key) => (key === 'onboarding.citizenship.validationAll' ? 'Answer everyone' : key);

  it('requires child answers when children are visible', () => {
    const draft = { user: false, partner: true, children: [null, true] };
    expect(validateCitizenshipDraft(draft, householdWithPartner, t)).toBe('Answer everyone');
  });

  it('passes when adults and visible children are answered', () => {
    const draft = { user: false, partner: true, children: [false, true] };
    expect(validateCitizenshipDraft(draft, householdWithPartner, t)).toBe('');
  });
});

describe('getNonCitizenPermitChain', () => {
  it('orders user, partner, then children', () => {
    const location = {
      isCzCitizen: false,
      partnerIsCzCitizen: false,
      childrenCitizenship: [
        { isCzCitizen: true },
        { isCzCitizen: false },
      ],
    };
    expect(getNonCitizenPermitChain(location, householdWithPartner)).toEqual([
      { subject: 'user', childIndex: 0 },
      { subject: 'partner', childIndex: 0 },
      { subject: 'child', childIndex: 1 },
    ]);
  });
});

describe('permit back routing', () => {
  const location = {
    isCzCitizen: false,
    partnerIsCzCitizen: false,
    childrenCitizenship: [{ isCzCitizen: false }],
  };
  const household = {
    type: 'partner',
    partnerName: 'Sarah',
    children: [{ displayName: 'Adam' }],
  };

  it('returns citizenship for the first permit screen', () => {
    expect(getResidencePermitBackRoute('user', 0, location, household))
      .toBe('/(onboarding)/citizenship');
  });

  it('returns previous permit for later members', () => {
    expect(getResidencePermitBackRoute('child', 0, location, household))
      .toBe('/(onboarding)/residence-permit?subject=partner');
  });

  it('occupation back lands on last permit', () => {
    expect(getOccupationBackRoute(location, household))
      .toBe('/(onboarding)/residence-permit?subject=child&childIndex=0');
  });
});
