/** @typedef {import('./oauth.js').OAuthProvider} OAuthProvider */

/**
 * Supabase OAuth options per provider (queryParams forwarded to the IdP).
 * Google always uses select_account — shared devices / multiple Google accounts.
 * @param {OAuthProvider} provider
 * @returns {{ queryParams?: Record<string, string> }}
 */
export function buildOAuthProviderOptions(provider) {
  if (provider === 'google') {
    return {
      queryParams: {
        prompt: 'select_account',
      },
    };
  }
  return {};
}
