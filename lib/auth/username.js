import { getSupabase } from '../supabase.js';
import { callSupabaseRpc } from '../supabaseRest.js';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/**
 * @param {string} value
 * @returns {string}
 */
export function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidUsernameFormat(value) {
  const normalized = normalizeUsername(value);
  if (normalized.length < USERNAME_MIN_LENGTH || normalized.length > USERNAME_MAX_LENGTH) {
    return false;
  }
  return USERNAME_PATTERN.test(normalized);
}

/**
 * @param {string} normalized
 * @returns {Promise<'available' | 'taken' | 'failed'>}
 */
async function checkViaRpc(normalized) {
  const { data, error } = await callSupabaseRpc('is_username_available', {
    check_username: normalized,
  });

  if (error) return 'failed';
  if (data === true) return 'available';
  if (data === false) return 'taken';
  return 'failed';
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} normalized
 * @returns {Promise<'available' | 'taken' | 'failed'>}
 */
async function checkViaEdgeFunction(supabase, normalized) {
  const { data, error } = await supabase.functions.invoke('username-check', {
    body: { username: normalized },
  });

  if (error) return 'failed';
  if (data?.available === true) return 'available';
  if (data?.available === false) return 'taken';
  return 'failed';
}

/**
 * @param {string} username
 * @returns {Promise<
 *   { ok: true, username: string }
 *   | { ok: false, reason: 'invalid' | 'taken' | 'unconfigured' | 'error' }
 * >}
 */
export async function checkUsernameAvailable(username) {
  const normalized = normalizeUsername(username);
  if (!isValidUsernameFormat(normalized)) {
    return { ok: false, reason: 'invalid' };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, reason: 'unconfigured' };
  }

  const rpcResult = await checkViaRpc(normalized);
  if (rpcResult === 'available') {
    return { ok: true, username: normalized };
  }
  if (rpcResult === 'taken') {
    return { ok: false, reason: 'taken' };
  }

  const edgeResult = await checkViaEdgeFunction(supabase, normalized);
  if (edgeResult === 'available') {
    return { ok: true, username: normalized };
  }
  if (edgeResult === 'taken') {
    return { ok: false, reason: 'taken' };
  }

  return { ok: false, reason: 'error' };
}
