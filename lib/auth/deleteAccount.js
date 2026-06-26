import { getSupabase, isSupabaseConfigured } from '../supabase.js';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ ok: true } | { ok: false, notAvailable?: boolean, error: string }>}
 */
async function deleteViaEdgeFunction(supabase) {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
    body: {},
  });

  if (error) {
    const message = error.message ?? 'edge_invoke_failed';
    const notDeployed = /not found|404|failed to send|function/i.test(message);
    return { ok: false, notAvailable: notDeployed, error: message };
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return { ok: false, error: String(data.error) };
  }

  return { ok: true };
}

/**
 * Delete the signed-in user from Supabase Auth (DB rows cascade via FK).
 * Tries RPC first, then delete-account Edge Function (Admin API).
 * @returns {Promise<{ ok: true } | { ok: false, error: string, code?: string }>}
 */
export async function deleteOwnSupabaseAccount() {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'supabase_not_configured', code: 'not_configured' };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured', code: 'not_configured' };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { ok: false, error: 'no_session', code: 'no_session' };
  }

  const { error: rpcError } = await supabase.rpc('delete_own_account');
  if (!rpcError) {
    return { ok: true };
  }

  const rpcMessage = rpcError.message ?? 'rpc_failed';
  const rpcMissing = /could not find the function|schema cache/i.test(rpcMessage);

  const edgeResult = await deleteViaEdgeFunction(supabase);
  if (edgeResult.ok) {
    return { ok: true };
  }

  if (!rpcMissing && !edgeResult.notAvailable) {
    return { ok: false, error: rpcMessage, code: 'rpc_failed' };
  }

  if (!edgeResult.notAvailable) {
    return { ok: false, error: edgeResult.error, code: 'edge_failed' };
  }

  return {
    ok: false,
    error: rpcMessage,
    code: 'not_configured',
  };
}

/**
 * @param {string} [code]
 * @param {(key: string) => string} t
 */
export function mapDeleteAccountErrorKey(code, errorMessage, t) {
  if (code === 'not_configured') {
    return t('settings.deleteAccountNotConfigured');
  }
  if (code === 'no_session') {
    return t('auth.errors.signInFailed');
  }
  return t('settings.deleteAccountFailed');
}
