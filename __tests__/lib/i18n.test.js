/**
 * Tests for i18n system
 */

import { translate } from '../../lib/i18n';

describe('i18n translate function', () => {
  test('returns translation for valid key in English', () => {
    const result = translate('en', 'app.name');
    expect(result).toBe('Beaverr');
  });

  test('returns translation for valid key in Czech', () => {
    const result = translate('cs', 'app.name');
    expect(result).toBe('Beaverr');
  });

  test('returns nested translation', () => {
    const result = translate('en', 'common.continue');
    expect(result).toBe('Continue');
  });

  test('returns key when translation is missing', () => {
    const result = translate('en', 'nonexistent.key');
    expect(result).toBe('nonexistent.key');
  });

  test('interpolates parameters correctly', () => {
    const result = translate('en', 'onboarding.progress', { percent: 50 });
    expect(result).toBe('50% complete');
  });

  test('handles missing parameters in interpolation', () => {
    const result = translate('en', 'onboarding.progress', {});
    expect(result).toBe('{{percent}}% complete');
  });

  test('returns same string when no interpolation needed', () => {
    const result = translate('en', 'app.tagline', {});
    expect(result).toBe('Not rich. Just ready.');
  });

  test('resolves dashboard metric explain keys in English', () => {
    expect(translate('en', 'dashboard.metricExplain.flexibleBudget.title')).toBe('Your spending budget');
    expect(translate('en', 'dashboard.metricExplain.tapHint')).toBe('Tap to see how this is calculated');
    expect(translate('en', 'dashboard.metricExplain.rows.income')).toBe('Monthly income');
  });

  test('resolves dashboard metric explain keys in Czech', () => {
    expect(translate('cs', 'dashboard.metricExplain.flexibleBudget.title')).toBe('Váš rozpočet na výdaje');
    expect(translate('cs', 'dashboard.metricExplain.recurringCosts.title')).toBe('Pravidelné náklady');
  });
});
