import { buildOAuthProviderOptions } from '../../lib/auth/oauthProviderOptions';
import { getUserOAuthProvider } from '../../lib/auth/getUserOAuthProvider';

describe('buildOAuthProviderOptions', () => {
  it('always prompts Google account selection', () => {
    expect(buildOAuthProviderOptions('google')).toEqual({
      queryParams: { prompt: 'select_account' },
    });
  });

  it('returns empty options for other providers', () => {
    expect(buildOAuthProviderOptions('facebook')).toEqual({});
    expect(buildOAuthProviderOptions('apple')).toEqual({});
  });
});

describe('getUserOAuthProvider', () => {
  it('returns google from identities', () => {
    expect(getUserOAuthProvider({
      identities: [{ provider: 'google' }],
    })).toBe('google');
  });

  it('ignores email identity when oauth identity exists', () => {
    expect(getUserOAuthProvider({
      identities: [
        { provider: 'email' },
        { provider: 'google' },
      ],
    })).toBe('google');
  });

  it('returns null for email-only users', () => {
    expect(getUserOAuthProvider({
      identities: [{ provider: 'email' }],
      app_metadata: { provider: 'email' },
    })).toBe(null);
  });
});
