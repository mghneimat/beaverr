import { commitmentIconSectionKey } from '../../lib/commitmentIcon';

describe('commitmentIconSectionKey', () => {
  it('maps sinking source prefixes to breakdown section keys', () => {
    expect(commitmentIconSectionKey('health_insurance:partner')).toBe('health');
    expect(commitmentIconSectionKey('vehicle_mot:v1')).toBe('transport');
    expect(commitmentIconSectionKey('subscription:sub1')).toBe('subscriptions');
    expect(commitmentIconSectionKey('residence_permit:user')).toBe('user');
    expect(commitmentIconSectionKey('child_cost:child_0:school')).toBe('children');
    expect(commitmentIconSectionKey(null)).toBe('other');
  });
});
