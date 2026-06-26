/**
 * Supabase OAuth — Google, Facebook, Apple.
 *
 * MANUAL SETUP (Supabase project fetbfivnidpaxcsadnnb):
 *
 * 1. Dashboard → Authentication → URL configuration
 *    - Site URL: https://beaverr.vercel.app (production)
 *    - Redirect URLs: https://beaverr.vercel.app/auth/callback,
 *      http://localhost:8081/auth/callback, beaverr://auth/callback
 *
 * 2. Enable providers (Authentication → Providers) and paste secrets from each console.
 *    Provider redirect URI in Google / Meta / Apple consoles:
 *    https://fetbfivnidpaxcsadnnb.supabase.co/auth/v1/callback
 *
 * 3. Email provider: disable "Confirm email" for local dev (see .env.example).
 *
 * @see https://supabase.com/docs/guides/auth/social-login
 */
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getSupabase } from '../supabase.js';
import { getAuthRedirectUri, getOAuthRedirectMisconfiguration, getOAuthRedirectPlaceholderMisconfiguration, logOAuthRedirectHint } from './getAuthRedirectUri.js';
import { handleOAuthCallbackUrl } from './oauthCallback.js';
import { mapOAuthErrorKey } from './mapAuthError.js';
import { buildOAuthProviderOptions } from './oauthProviderOptions.js';

WebBrowser.maybeCompleteAuthSession();

/** @typedef {'google' | 'facebook' | 'apple'} OAuthProvider */

/**
 * @param {OAuthProvider} provider
 * @returns {Promise<{ ok: true, session?: import('@supabase/supabase-js').Session | null, pendingRedirect?: boolean } | { ok: false, error: string }>}
 */
export async function signInWithOAuthProvider(provider) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const redirectTo = getAuthRedirectUri();
  const providerOptions = buildOAuthProviderOptions(provider);

  const misconfiguration = getOAuthRedirectMisconfiguration()
    ?? getOAuthRedirectPlaceholderMisconfiguration();
  if (misconfiguration) {
    return { ok: false, error: misconfiguration };
  }

  if (Platform.OS === 'web') {
    logOAuthRedirectHint();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, ...providerOptions },
    });
    if (error) {
      return { ok: false, error: mapOAuthErrorKey(error.message) };
    }
    return { ok: true, pendingRedirect: true };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      ...providerOptions,
    },
  });

  if (error) {
    return { ok: false, error: mapOAuthErrorKey(error.message) };
  }
  if (!data?.url) {
    return { ok: false, error: 'oauth_no_url' };
  }

  const browserResult = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectTo,
    Platform.OS === 'ios' ? { preferEphemeralSession: true } : undefined,
  );
  if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
    return { ok: false, error: 'oauth_cancelled' };
  }
  if (browserResult.type !== 'success' || !browserResult.url) {
    return { ok: false, error: 'oauth_failed' };
  }

  return handleOAuthCallbackUrl(browserResult.url);
}

export { getAuthRedirectUri };
