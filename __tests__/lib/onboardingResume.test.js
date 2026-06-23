import { getPreviousSectionLastRoute } from '../../lib/onboardingResume';

describe('onboardingResume', () => {
  test('getPreviousSectionLastRoute returns last question route before splash', () => {
    expect(getPreviousSectionLastRoute('splash-income')).toBe('occupation');
    expect(getPreviousSectionLastRoute('splash-housing')).toBe('strategy');
    expect(getPreviousSectionLastRoute('splash-transport')).toBe('housing');
  });

  test('getPreviousSectionLastRoute returns null for unknown splash', () => {
    expect(getPreviousSectionLastRoute('splash-unknown')).toBeNull();
  });

  test('getPreviousSectionLastRoute accepts full route paths', () => {
    expect(getPreviousSectionLastRoute('/(onboarding)/splash-income')).toBe('occupation');
  });
});
