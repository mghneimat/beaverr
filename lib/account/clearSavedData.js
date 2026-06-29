import { resetLocalUserData } from '../auth/userDataScope.js';
import { getHouseholdForUser, upsertHouseholdData } from '../cloud/householdRepository.js';
import { clearScheduledCloudPush } from '../cloud/syncHousehold.js';
import { isSupabaseConfigured } from '../supabase.js';

/**
 * Clear household data on device and cloud while keeping the signed-in account.
 * @param {string} userId
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function clearSavedData(userId) {
  if (!userId) {
    return { ok: false, error: 'missing_user' };
  }

  clearScheduledCloudPush();

  try {
    if (isSupabaseConfigured()) {
      const record = await getHouseholdForUser(userId);
      if (record) {
        await upsertHouseholdData(record.householdId, {}, record.version);
      }
    }

    await resetLocalUserData(userId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}
