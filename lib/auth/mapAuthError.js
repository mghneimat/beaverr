/** @typedef {'signUpFailed' | 'emailAlreadyRegistered' | 'passwordWeak' | 'confirmEmail' | 'signInFailed' | 'socialSignInFailed' | 'oauthCancelled' | 'oauthLocalhostMobile' | 'accountExists' | 'misconfigured'} AuthErrorKey */

const EMAIL_TAKEN_RE = /already (registered|exists|been registered)|user already/i;
const EMAIL_CONFIRM_RE = /email not confirmed|email_not_confirmed|confirm your email|email.*not.*confirm/i;

/**
 * Sign-in blocked until the user confirms their email (account may already exist).
 * @param {string | undefined} error
 */
export function isEmailConfirmationRequired(error) {
  if (!error) return false;
  return EMAIL_CONFIRM_RE.test(String(error));
}

/**
 * Map Supabase sign-up failures to i18n error keys (no raw server text in UI).
 * @param {string | undefined} error
 * @returns {SignUpErrorKey}
 */
export function mapSignUpErrorKey(error) {
  if (!error) return 'signUpFailed';
  if (error === 'email_already_registered') return 'emailAlreadyRegistered';
  const message = String(error);
  if (/invalid api key|missing api key|http_401/i.test(message)) return 'misconfigured';
  if (EMAIL_TAKEN_RE.test(message)) return 'emailAlreadyRegistered';
  if (/password/i.test(message) && /(weak|short|least|characters)/i.test(message)) {
    return 'passwordWeak';
  }
  if (/confirm/i.test(message) && /email/i.test(message)) return 'confirmEmail';
  return 'signUpFailed';
}

/**
 * Map OAuth failures to i18n keys.
 * @param {string | undefined} error
 * @returns {AuthErrorKey}
 */
export function mapOAuthErrorKey(error) {
  if (!error) return 'socialSignInFailed';
  if (error === 'oauth_cancelled') return 'oauthCancelled';
  if (error === 'oauth_localhost_mobile') return 'oauthLocalhostMobile';
  if (error === 'oauth_redirect_origin_placeholder') return 'oauthRedirectOriginPlaceholder';
  if (error === 'oauth_callback_invalid' || error === 'oauth_failed') return 'socialSignInFailed';
  const message = String(error);
  if (/already|exists|registered|identity/i.test(message)) return 'accountExists';
  if (/invalid api key|missing api key|http_401/i.test(message)) return 'misconfigured';
  if (/code verifier|flow state|pkce/i.test(message)) return 'oauthPkceMismatch';
  return 'socialSignInFailed';
}
