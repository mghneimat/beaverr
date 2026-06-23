import {
  LEGACY_STEP_ALIASES_BY_ROUTE,
  LEGACY_STEP_ALIASES_FLAT,
  normalizeOnboardingStep,
  routeToStepName,
} from '../../lib/onboardingStepAliases';

describe('onboardingStepAliases', () => {
  test('routeToStepName extracts route from full onboarding path', () => {
    expect(routeToStepName('/(onboarding)/income')).toBe('income');
    expect(routeToStepName('income')).toBe('income');
  });

  test('normalizeOnboardingStep maps legacy q* ids per route', () => {
    expect(normalizeOnboardingStep('income', 'q5')).toBe('yourIncome');
    expect(normalizeOnboardingStep('housing', 'q6b')).toBe('rentUtilities');
    expect(normalizeOnboardingStep('budget-rollover', 'q14a')).toBe('rollover');
  });

  test('normalizeOnboardingStep maps kebab-case to camelCase', () => {
    expect(normalizeOnboardingStep('income', 'your-income')).toBe('yourIncome');
    expect(normalizeOnboardingStep('transport', 'vehicle-fuel')).toBe('vehicleFuel');
  });

  test('normalizeOnboardingStep preserves semantic camelCase ids', () => {
    expect(normalizeOnboardingStep('income', 'yourIncome')).toBe('yourIncome');
    expect(normalizeOnboardingStep('transport', 'vehicleFuel')).toBe('vehicleFuel');
  });

  test('LEGACY_STEP_ALIASES_FLAT includes semantic step values', () => {
    const flatValues = Object.values(LEGACY_STEP_ALIASES_FLAT);
    expect(flatValues).toContain('yourIncome');
    expect(flatValues).toContain('govtTaxes');
    expect(Object.keys(LEGACY_STEP_ALIASES_BY_ROUTE)).toContain('housing');
  });
});
