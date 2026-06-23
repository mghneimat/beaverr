import {
  getDeviceTier,
  PHONE_MAX,
  TABLET_MAX,
  DASHBOARD_WIDE_BREAKPOINT,
} from '../../lib/layoutBreakpoints';
import { getOnboardingLayout } from '../../lib/onboardingLayout';

describe('getDeviceTier', () => {
  it('returns phone below PHONE_MAX', () => {
    expect(getDeviceTier(375)).toBe('phone');
    expect(getDeviceTier(PHONE_MAX - 1)).toBe('phone');
  });

  it('returns tablet between phone and TABLET_MAX', () => {
    expect(getDeviceTier(PHONE_MAX)).toBe('tablet');
    expect(getDeviceTier(600)).toBe('tablet');
    expect(getDeviceTier(TABLET_MAX - 1)).toBe('tablet');
  });

  it('returns desktop at TABLET_MAX and above', () => {
    expect(getDeviceTier(TABLET_MAX)).toBe('desktop');
    expect(getDeviceTier(1024)).toBe('desktop');
  });

  it('aliases TABLET_MAX to dashboard wide breakpoint', () => {
    expect(TABLET_MAX).toBe(DASHBOARD_WIDE_BREAKPOINT);
  });
});

describe('getOnboardingLayout surfaceVariant', () => {
  it('uses fullBleed on phone', () => {
    expect(getOnboardingLayout(375)).toMatchObject({
      deviceTier: 'phone',
      surfaceVariant: 'fullBleed',
      pagePadH: 0,
      contentPadH: 16,
    });
  });

  it('uses card on tablet', () => {
    expect(getOnboardingLayout(600)).toMatchObject({
      deviceTier: 'tablet',
      surfaceVariant: 'card',
      pagePadH: 20,
    });
  });

  it('uses card on desktop', () => {
    expect(getOnboardingLayout(1024)).toMatchObject({
      deviceTier: 'desktop',
      surfaceVariant: 'card',
      pagePadH: 20,
    });
  });
});
