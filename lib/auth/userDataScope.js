import { getData, setData, clearAllData, removeData } from '../storage.js';
import { STORAGE_KEYS } from '../beaverrConstants.js';
import { SYNC_META_STORAGE_KEY, SYNCABLE_STORAGE_KEYS } from '../cloud/syncKeys.js';
import { getHouseholdForUser } from '../cloud/householdRepository.js';

/**
 * @returns {Promise<boolean>}
 */
export async function localSnapshotHasData() {
  const entries = await Promise.all(
    SYNCABLE_STORAGE_KEYS.map(async (key) => getData(key)),
  );
  return entries.some((value) => value != null);
}

/**
 * @returns {Promise<string|null>}
 */
export async function getStoredAuthUserId() {
  const settings = (await getData(STORAGE_KEYS.settings)) || {};
  const id = settings.authUserId;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}

/**
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function setStoredAuthUserId(userId) {
  const settings = (await getData(STORAGE_KEYS.settings)) || {};
  await setData(STORAGE_KEYS.settings, { ...settings, authUserId: userId });
}

/**
 * Wipe local household data and re-bind storage to a user account.
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function resetLocalUserData(userId) {
  await clearAllData();
  await removeData(SYNC_META_STORAGE_KEY);
  await setStoredAuthUserId(userId);
}

/**
 * Ensure local storage belongs to the signed-in user — clears stale or prior-user data.
 * @param {string} userId
 * @returns {Promise<{ action: 'noop' | 'switched_user' | 'cleared_stale_local' | 'linked_remote' | 'linked_empty' }>}
 */
export async function ensureLocalDataForUser(userId) {
  if (!userId) {
    return { action: 'noop' };
  }

  const stored = await getStoredAuthUserId();
  if (stored === userId) {
    return { action: 'noop' };
  }

  if (stored && stored !== userId) {
    await resetLocalUserData(userId);
    return { action: 'switched_user' };
  }

  const record = await getHouseholdForUser(userId);
  const remoteHasData = Boolean(record && Object.keys(record.data || {}).length > 0);
  const localHasData = await localSnapshotHasData();

  if (remoteHasData) {
    if (localHasData) {
      await resetLocalUserData(userId);
    } else {
      await setStoredAuthUserId(userId);
    }
    return { action: 'linked_remote' };
  }

  if (localHasData) {
    await resetLocalUserData(userId);
    return { action: 'cleared_stale_local' };
  }

  await setStoredAuthUserId(userId);
  return { action: 'linked_empty' };
}
