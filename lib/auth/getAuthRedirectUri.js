/**

 * OAuth redirect URI for Supabase sign-in.

 * @see lib/auth/oauth.js for Supabase Dashboard + provider console setup.

 */

import * as Linking from 'expo-linking';

import { Platform } from 'react-native';

import { isMobileWebTouch } from '../isMobileWebTouch.js';



const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const PLACEHOLDER_ORIGIN_RE = /x\.x|YOUR[-_]?PC|LAN[-_]?IP|REPLACE/i;



/**

 * @param {string | undefined} value

 * @returns {string | null}

 */

function normalizeRedirectOrigin(value) {

  const trimmed = value?.trim();

  if (!trimmed || PLACEHOLDER_ORIGIN_RE.test(trimmed)) return null;

  return trimmed.replace(/\/$/, '');

}



/**

 * Web origin used for OAuth redirect.

 * Always matches the current browser tab — required so PKCE verifier (localStorage) and callback share one origin.

 * EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN applies only on mobile web when stuck on localhost (unreachable on a phone).

 * @returns {string | null}

 */

export function getAuthRedirectOrigin() {

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {

    const current = window.location.origin.replace(/\/$/, '');

    const override = normalizeRedirectOrigin(process.env.EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN);



    if (override && isMobileWebTouch() && LOCALHOST_ORIGIN_RE.test(current)) {

      return override;

    }



    return current;

  }



  const override = normalizeRedirectOrigin(process.env.EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN);

  if (override) return override;



  return null;

}



/**

 * @returns {string}

 */

export function getAuthRedirectUri() {

  const origin = getAuthRedirectOrigin();

  if (origin) {

    return `${origin}/auth/callback`;

  }



  return Linking.createURL('/auth/callback', { scheme: 'beaverr' });

}



/**

 * Block OAuth when mobile web would use localhost (unreachable on a physical phone).

 * @returns {'oauth_localhost_mobile' | null}

 */

export function getOAuthRedirectMisconfiguration() {

  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  if (!isMobileWebTouch()) return null;



  const current = window.location.origin.replace(/\/$/, '');

  if (!LOCALHOST_ORIGIN_RE.test(current)) return null;



  const override = normalizeRedirectOrigin(process.env.EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN);

  if (override) return null;



  return 'oauth_localhost_mobile';

}



/**

 * Env override left at a docs placeholder (e.g. 192.168.x.x).

 * @returns {'oauth_redirect_origin_placeholder' | null}

 */

export function getOAuthRedirectPlaceholderMisconfiguration() {

  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  if (!isMobileWebTouch()) return null;



  const current = window.location.origin.replace(/\/$/, '');

  if (!LOCALHOST_ORIGIN_RE.test(current)) return null;



  const raw = process.env.EXPO_PUBLIC_AUTH_REDIRECT_ORIGIN?.trim();

  if (!raw || !PLACEHOLDER_ORIGIN_RE.test(raw)) return null;

  return 'oauth_redirect_origin_placeholder';

}



/**

 * Dev hint — log the exact URL to add in Supabase Redirect URLs.

 */

export function logOAuthRedirectHint() {

  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  const redirectTo = getAuthRedirectUri();

  const current = window.location.origin;

  console.info(

    `[Beaverr OAuth] origin=${current} redirectTo=${redirectTo} — add redirectTo under Supabase → Authentication → Redirect URLs.`,

  );

}


