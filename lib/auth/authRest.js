import { getSupabaseEnv, buildSupabaseRestHeaders } from '../supabaseRest.js';

/**
 * @param {string} path
 * @param {Record<string, unknown>} body
 * @param {Record<string, string>} [searchParams]
 */
async function authPost(path, body, searchParams) {
  const { url, key } = getSupabaseEnv();
  if (!url || !key) {
    return { ok: false, error: 'supabase_not_configured', data: null };
  }

  const query = searchParams
    ? `?${new URLSearchParams(searchParams).toString()}`
    : '';

  try {
    const res = await fetch(`${url}/auth/v1/${path}${query}`, {
      method: 'POST',
      headers: buildSupabaseRestHeaders(key),
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data.msg || data.error_description || data.message || `http_${res.status}`;
      return { ok: false, error: message, data: null };
    }

    return { ok: true, error: null, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'network_error',
      data: null,
    };
  }
}

/**
 * @param {string} email
 * @param {string} password
 * @param {{ locale?: string }} [options]
 */
export async function signUpViaRest(email, password, options = {}) {
  return authPost('signup', {
    email: email.trim(),
    password,
    data: { locale: options.locale ?? 'en' },
  });
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function signInViaRest(email, password) {
  return authPost('token', { email: email.trim(), password }, { grant_type: 'password' });
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ access_token?: string, refresh_token?: string }} tokens
 */
export async function applyAuthSession(supabase, tokens) {
  if (!tokens.access_token || !tokens.refresh_token) return;
  await supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
}
