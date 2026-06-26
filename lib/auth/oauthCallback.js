import { getSupabase } from '../supabase.js';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {number} [maxMs]
 * @returns {Promise<import('@supabase/supabase-js').Session | null>}
 */
async function waitForSession(supabase, maxMs = 2000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return null;
}

/**
 * Exchange OAuth callback URL for a Supabase session.
 * @param {string} url
 * @returns {Promise<{ ok: true, session: import('@supabase/supabase-js').Session | null } | { ok: false, error: string }>}
 */
export async function handleOAuthCallbackUrl(url) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const parsed = new URL(url);
  const errorDescription = parsed.searchParams.get('error_description')
    ?? parsed.searchParams.get('error');
  if (errorDescription) {
    return { ok: false, error: errorDescription };
  }

  const code = parsed.searchParams.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      return { ok: true, session: data.session };
    }
    if (error) {
      const existing = await waitForSession(supabase, 500);
      if (existing) {
        return { ok: true, session: existing };
      }
      return { ok: false, error: error.message };
    }
  }

  const hash = parsed.hash?.replace(/^#/, '') ?? '';
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, session: data.session ?? null };
  }

  const existing = await waitForSession(supabase, 500);
  if (existing) {
    return { ok: true, session: existing };
  }

  return { ok: false, error: 'oauth_callback_invalid' };
}
