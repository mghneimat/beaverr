import {
  CHILD_RESIDENCE_PERMIT_RENEWAL_UNDER_15,
  defaultChildResidencePermitRenewalCost,
  isChildUnder15ForPermitRenewal,
} from '../../lib/residencePermits';

describe('isChildUnder15ForPermitRenewal', () => {
  it('returns true for 0-2, 3-5, and 6-15 age groups', () => {
    expect(isChildUnder15ForPermitRenewal('0-2')).toBe(true);
    expect(isChildUnder15ForPermitRenewal('3-5')).toBe(true);
    expect(isChildUnder15ForPermitRenewal('6-15')).toBe(true);
  });

  it('returns false for 16-18 and 18+', () => {
    expect(isChildUnder15ForPermitRenewal('16-18')).toBe(false);
    expect(isChildUnder15ForPermitRenewal('18+')).toBe(false);
  });
});

describe('defaultChildResidencePermitRenewalCost', () => {
  it('returns 1000 CZK for children under 15', () => {
    expect(defaultChildResidencePermitRenewalCost('6-15')).toBe(
      CHILD_RESIDENCE_PERMIT_RENEWAL_UNDER_15,
    );
  });

  it('returns null for older children', () => {
    expect(defaultChildResidencePermitRenewalCost('16-18')).toBeNull();
  });
});
