import { getSupabase } from '../supabase.js';

/**
 * Whether the signed-in user has profiles.role = 'admin'.
 * Uses is_admin() RPC, then falls back to reading own profile (RLS-safe).
 * @returns {Promise<boolean>}
 */
export async function fetchIsAdmin() {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data: rpcData, error: rpcError } = await supabase.rpc('is_admin');
  if (!rpcError && typeof rpcData === 'boolean') {
    return rpcData;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (error || !data) return false;
  return data.role === 'admin';
}
