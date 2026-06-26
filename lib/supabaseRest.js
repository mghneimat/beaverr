/**
 * Direct PostgREST calls — works with legacy anon JWT and sb_publishable_ keys.
 * Publishable keys must be sent on apikey; Authorization Bearer must match apikey exactly.
 * @see https://supabase.com/docs/guides/api/api-keys
 */

/**
 * Strip accidental wrapping chars from pasted Dashboard keys (e.g. `<eyJ...>`).
 * @param {string | undefined} key
 * @returns {string | undefined}
 */
export function normalizeSupabaseKey(key) {
  if (!key) return key;
  return key.trim().replace(/^<+|>+$/g, '');
}

/**
 * @returns {{ url?: string, key?: string }}
 */
export function getSupabaseEnv() {
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim(),
    key: normalizeSupabaseKey(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  };
}

/**
 * @param {string} key
 */
export function buildSupabaseRestHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

/**
 * @param {string} functionName
 * @param {Record<string, unknown>} args
 * @returns {Promise<{ data: unknown, error: { message: string, status?: number } | null }>}
 */
export async function callSupabaseRpc(functionName, args) {
  const { url, key } = getSupabaseEnv();
  if (!url || !key) {
    return { data: null, error: { message: 'unconfigured' } };
  }

  try {
    const res = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: buildSupabaseRestHeaders(key),
      body: JSON.stringify(args),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        data: null,
        error: { message: text || res.statusText, status: res.status },
      };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'network_error' },
    };
  }
}
