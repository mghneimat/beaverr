import { getSupabase } from '../supabase.js';
import { updateProfileLocale } from '../cloud/householdRepository.js';
import {
  applyAuthSession,
  signInViaRest,
  signUpViaRest,
} from './authRest.js';

/**
 * @param {Record<string, unknown> | null} data
 */
function hasEmptyIdentities(data) {
  const user = data?.user;
  return Boolean(user && (!user.identities || user.identities.length === 0));
}

/**
 * @param {string} email
 * @param {string} password
 * @param {{ locale?: string }} [options]
 * @returns {Promise<{ ok: true, session: import('@supabase/supabase-js').Session | null } | { ok: false, error: string }>}
 */
export async function signUpWithPassword(email, password, options = {}) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const result = await signUpViaRest(email, password, options);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  if (hasEmptyIdentities(result.data)) {
    return { ok: false, error: 'email_already_registered' };
  }

  await applyAuthSession(supabase, result.data ?? {});

  const userId = result.data?.user?.id;
  if (userId && options.locale) {
    await updateProfileLocale(userId, options.locale);
  }

  return { ok: true, session: result.data?.session ?? null };
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ ok: true, session: import('@supabase/supabase-js').Session | null } | { ok: false, error: string }>}
 */
export async function signInWithPassword(email, password) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const result = await signInViaRest(email, password);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await applyAuthSession(supabase, result.data ?? {});

  const { data: sessionData } = await supabase.auth.getSession();
  return { ok: true, session: sessionData.session ?? null };
}

/**
 * @returns {Promise<void>}
 */
export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * @param {string} email
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function resetPasswordForEmail(email) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
