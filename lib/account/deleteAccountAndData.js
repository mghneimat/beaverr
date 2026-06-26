import { deleteOwnSupabaseAccount } from '../auth/deleteAccount.js';
import { clearAllData, removeData } from '../storage.js';
import { clearScheduledCloudPush } from '../cloud/syncHousehold.js';
import { SYNC_META_STORAGE_KEY } from '../cloud/syncKeys.js';
import { getSupabase, isSupabaseConfigured } from '../supabase.js';

/**
 * Delete Supabase account, cloud-linked data, and all local app data; end session.
 * @returns {Promise<{ ok: true } | { ok: false, error: string, code?: string }>}
 */
export async function deleteAccountAndData() {
  clearScheduledCloudPush();

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
    if (data?.session) {
      const deleted = await deleteOwnSupabaseAccount();
      if (!deleted.ok) {
        return deleted;
      }
    }
  }

  await clearAllData();
  await removeData(SYNC_META_STORAGE_KEY);

  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return { ok: true };
}
