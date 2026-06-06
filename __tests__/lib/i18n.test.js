/**
 * Tests for i18n system
 */

import { translate } from '../../lib/i18n';

describe('i18n translate function', () => {
  test('returns translation for valid key in English', () => {
    const result = translate('en', 'app.name');
    expect(result).toBe('PocketOS');
  });

  test('returns translation for valid key in Czech', () => {
    const result = translate('cs', 'app.name');
    expect(result).toBe('PocketOS');
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
    expect(result).toBe('Your household finances, finally clear.');
  });
});
