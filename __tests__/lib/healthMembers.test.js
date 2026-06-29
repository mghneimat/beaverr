import { isActiveHealthMemberKey, getHealthMemberLabel, getSinkingHealthInsuranceName } from '../../lib/healthMembers';

const t = (key) => key;

describe('isActiveHealthMemberKey', () => {
  it('accepts user and self keys', () => {
    expect(isActiveHealthMemberKey('user', {})).toBe(true);
    expect(isActiveHealthMemberKey('self', {})).toBe(true);
  });

  it('accepts partner only when household has a partner', () => {
    expect(isActiveHealthMemberKey('partner', {})).toBe(false);
    expect(isActiveHealthMemberKey('partner', { partnerName: 'Alex' })).toBe(true);
  });

  it('rejects child keys when household has no children', () => {
    expect(isActiveHealthMemberKey('child_0', { children: [] })).toBe(false);
    expect(isActiveHealthMemberKey('child_0', {})).toBe(false);
  });

  it('accepts child keys only within household child count', () => {
    const household = { children: [{ displayName: 'Sam' }] };
    expect(isActiveHealthMemberKey('child_0', household)).toBe(true);
    expect(isActiveHealthMemberKey('child_1', household)).toBe(false);
  });
});

describe('getHealthMemberLabel', () => {
  it('maps user and self to self label', () => {
    expect(getHealthMemberLabel('user', {}, t)).toBe('dashboard.recurring.healthSelf');
    expect(getHealthMemberLabel('self', {}, t)).toBe('dashboard.recurring.healthSelf');
  });

  it('maps partner and child keys', () => {
    expect(getHealthMemberLabel('partner', {}, t)).toBe('dashboard.recurring.healthPartner');
    expect(getHealthMemberLabel('child_0', { children: [{}] }, t)).toBe('dashboard.recurring.healthChild');
  });
});

describe('getSinkingHealthInsuranceName', () => {
  it('uses partner name without duplicating health insurance', () => {
    expect(getSinkingHealthInsuranceName('partner', { partnerName: 'Jana' }, t))
      .toBe('dashboard.savingsScreen.sinkingFund.healthInsuranceNamed');
  });

  it('uses self label for user key', () => {
    expect(getSinkingHealthInsuranceName('user', {}, t))
      .toBe('dashboard.savingsScreen.sinkingFund.healthInsuranceYou');
  });
});
