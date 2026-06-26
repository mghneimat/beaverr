import { mapSignUpErrorKey, isEmailConfirmationRequired, mapOAuthErrorKey } from '../../lib/auth/mapAuthError';

describe('mapSignUpErrorKey', () => {  it('maps duplicate email signals', () => {
    expect(mapSignUpErrorKey('email_already_registered')).toBe('emailAlreadyRegistered');
    expect(mapSignUpErrorKey('User already registered')).toBe('emailAlreadyRegistered');
  });

  it('maps invalid api key to misconfigured', () => {
    expect(mapSignUpErrorKey('Invalid API key')).toBe('misconfigured');
    expect(mapSignUpErrorKey('http_401')).toBe('misconfigured');
  });

  it('maps password policy failures', () => {
    expect(mapSignUpErrorKey('Password should be at least 8 characters')).toBe('passwordWeak');
  });

  it('falls back to signUpFailed', () => {
    expect(mapSignUpErrorKey('network error')).toBe('signUpFailed');
    expect(mapSignUpErrorKey(undefined)).toBe('signUpFailed');
  });
});

describe('isEmailConfirmationRequired', () => {
  it('detects unconfirmed email errors', () => {
    expect(isEmailConfirmationRequired('Email not confirmed')).toBe(true);
    expect(isEmailConfirmationRequired('email_not_confirmed')).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isEmailConfirmationRequired('Invalid login credentials')).toBe(false);
    expect(isEmailConfirmationRequired(undefined)).toBe(false);
  });
});

describe('mapOAuthErrorKey', () => {
  it('maps cancellation and duplicate account errors', () => {
    expect(mapOAuthErrorKey('oauth_cancelled')).toBe('oauthCancelled');
    expect(mapOAuthErrorKey('User already registered')).toBe('accountExists');
  });

  it('maps oauth callback failures to socialSignInFailed', () => {
    expect(mapOAuthErrorKey('oauth_callback_invalid')).toBe('socialSignInFailed');
    expect(mapOAuthErrorKey(undefined)).toBe('socialSignInFailed');
  });
});
