/** @typedef {import('./oauth.js').OAuthProvider} OAuthProvider */

/** All OAuth providers shown in auth UI (order matters). */
/** @type {readonly OAuthProvider[]} */
export const OAUTH_PROVIDERS = ['google', 'apple', 'facebook'];

/** Providers wired in Supabase — move others here when ready. */
/** @type {readonly OAuthProvider[]} */
export const ENABLED_OAUTH_PROVIDERS = ['google'];

/**
 * @param {OAuthProvider} provider
 * @returns {boolean}
 */
export function isOAuthProviderEnabled(provider) {
  return ENABLED_OAUTH_PROVIDERS.includes(provider);
}
