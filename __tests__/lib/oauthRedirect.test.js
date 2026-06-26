jest.mock('expo-linking', () => ({
  createURL: jest.fn((path, { scheme } = {}) => `${scheme ?? 'beaverr'}:/${path.replace(/^\//, '')}`),
}));

jest.mock('../../lib/isMobileWebTouch', () => ({
  isMobileWebTouch: jest.fn(() => false),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import { isMobileWebTouch } from '../../lib/isMobileWebTouch';
import {
  getAuthRedirectOrigin,
  getAuthRedirectUri,
  getOAuthRedirectMisconfiguration,
} from '../../lib/auth/getAuthRedirectUri';

describe('getAuthRedirectUri', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN;
    isMobileWebTouch.mockReturnValue(false);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses web origin on web when window is available', () => {
    const rn = require('react-native');
    rn.Platform.OS = 'web';
    global.window = { location: { origin: 'http://localhost:8081' } };

    expect(getAuthRedirectUri()).toBe('http://localhost:8081/auth/callback');
    expect(getAuthRedirectOrigin()).toBe('http://localhost:8081');
  });

  it('ignores env override on desktop web (PKCE must match tab origin)', () => {
    const rn = require('react-native');
    rn.Platform.OS = 'web';
    process.env.EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN = 'http://192.168.0.232:8081';
    global.window = { location: { origin: 'http://localhost:8081' } };
    isMobileWebTouch.mockReturnValue(false);

    expect(getAuthRedirectUri()).toBe('http://localhost:8081/auth/callback');
  });

  it('uses deep link scheme on native', () => {
    const rn = require('react-native');
    rn.Platform.OS = 'ios';
    global.window = undefined;

    expect(getAuthRedirectUri()).toBe('beaverr:/auth/callback');
  });

  it('blocks localhost OAuth on mobile web', () => {
    const rn = require('react-native');
    rn.Platform.OS = 'web';
    global.window = { location: { origin: 'http://localhost:8081' } };
    isMobileWebTouch.mockReturnValue(true);

    expect(getOAuthRedirectMisconfiguration()).toBe('oauth_localhost_mobile');
  });

  it('allows LAN origin on mobile web', () => {
    const rn = require('react-native');
    rn.Platform.OS = 'web';
    global.window = { location: { origin: 'http://192.168.1.42:8081' } };
    isMobileWebTouch.mockReturnValue(true);

    expect(getOAuthRedirectMisconfiguration()).toBeNull();
  });
});
