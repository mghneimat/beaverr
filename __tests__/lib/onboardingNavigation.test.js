import {
  buildHref,
  entriesEqual,
  getNavHistory,
  parseHref,
  recordVisit,
  navigateBack,
  segmentsToOnboardingRoute,
  __resetNavHistoryForTests,
} from '../../lib/onboardingNavigation';

describe('onboardingNavigation', () => {
  beforeEach(() => {
    __resetNavHistoryForTests([]);
  });

  test('buildHref encodes step params', () => {
    expect(buildHref('/(onboarding)/income', { step: 'savings' })).toBe(
      '/(onboarding)/income?step=savings',
    );
  });

  test('parseHref round-trips', () => {
    const href = '/(onboarding)/household?step=partner';
    expect(parseHref(href)).toEqual({
      route: '/(onboarding)/household',
      params: { step: 'partner' },
    });
  });

  test('segmentsToOnboardingRoute uses leaf segment', () => {
    expect(segmentsToOnboardingRoute(['(onboarding)', 'splash-household'])).toBe(
      '/(onboarding)/splash-household',
    );
    expect(segmentsToOnboardingRoute(['(onboarding)', 'income'])).toBe(
      '/(onboarding)/income',
    );
  });

  test('entriesEqual compares params', () => {
    expect(entriesEqual(
      { route: '/(onboarding)/income', params: { step: 'yourIncome' } },
      { route: '/(onboarding)/income', params: { step: 'yourIncome' } },
    )).toBe(true);
    expect(entriesEqual(
      { route: '/(onboarding)/income', params: { step: 'yourIncome' } },
      { route: '/(onboarding)/income', params: { step: 'savings' } },
    )).toBe(false);
  });

  test('recordVisit replaces last entry for same route step changes', () => {
    recordVisit('/(onboarding)/income', { step: 'yourIncome' });
    recordVisit('/(onboarding)/income', { step: 'partnerIncome' });
    expect(getNavHistory()).toEqual([
      { route: '/(onboarding)/income', params: { step: 'partnerIncome' } },
    ]);
  });

  test('recordVisit appends distinct routes', () => {
    recordVisit('/(onboarding)/welcome');
    recordVisit('/(onboarding)/consent');
    expect(getNavHistory()).toEqual([
      { route: '/(onboarding)/welcome' },
      { route: '/(onboarding)/consent' },
    ]);
  });

  test('navigateBack with empty history does not throw', async () => {
    await expect(navigateBack()).resolves.toBeUndefined();
  });

  test('recordVisit prefers URL step over stale progressStep when URL has step', () => {
    // Simulates useOnboardingScreen logic: URL step must not be overwritten.
    recordVisit('/(onboarding)/household', { step: 'childDetails', childIndex: '1' });
    expect(getNavHistory()).toEqual([
      { route: '/(onboarding)/household', params: { step: 'childDetails', childIndex: '1' } },
    ]);
  });
});
