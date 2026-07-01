import { getSupabase } from '../supabase.js';
import { fetchIsAdmin } from './isAdmin.js';

/**
 * @param {string} action
 * @param {Record<string, unknown>} [payload]
 */
export async function invokeAdminApi(action, payload = {}) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: { action, payload },
  });

  if (error) {
    return { ok: false, error: 'edge_invoke_failed', detail: error.message };
  }

  if (data?.error === 'forbidden') {
    return { ok: false, error: 'forbidden' };
  }

  if (data?.error) {
    return { ok: false, error: data.error, detail: data.detail };
  }

  return { ok: true, data };
}

/**
 * @returns {Promise<{ ok: true, isAdmin: boolean } | { ok: false, error: string }>}
 */
export async function checkAdminAccess() {
  const isAdmin = await fetchIsAdmin();
  return { ok: true, isAdmin };
}
