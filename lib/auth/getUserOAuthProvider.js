/** @typedef {import('./oauth.js').OAuthProvider} OAuthProvider */

/**
 * Primary OAuth provider for a signed-in user (null for email/password-only).
 * @param {import('@supabase/supabase-js').User | null | undefined} user
 * @returns {OAuthProvider | null}
 */
export function getUserOAuthProvider(user) {
  if (!user) return null;

  const fromIdentities = user.identities?.find(
    (identity) => identity.provider && identity.provider !== 'email',
  );
  if (fromIdentities?.provider === 'google'
    || fromIdentities?.provider === 'facebook'
    || fromIdentities?.provider === 'apple') {
    return fromIdentities.provider;
  }

  const metaProvider = user.app_metadata?.provider;
  if (metaProvider === 'google' || metaProvider === 'facebook' || metaProvider === 'apple') {
    return metaProvider;
  }

  return null;
}
