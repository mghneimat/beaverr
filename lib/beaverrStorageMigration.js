/**
 * One-time migration: beaverr_* localStorage keys → beaverr_*.
 */

import {
  LEGACY_STORAGE_ALIASES,
  STORAGE_KEYS,
} from './beaverrConstants';

/**
 * @param {import('./storage').StorageAdapter} rawStorage
 * @returns {Promise<boolean>} true if any key was migrated
 */
export async function migrateLegacyStorageKeys(rawStorage) {
  const flag = await rawStorage.getItem(STORAGE_KEYS.storageMigrated);
  if (flag === 'true') return false;

  let migrated = false;

  for (const [legacyKey, newKey] of Object.entries(LEGACY_STORAGE_ALIASES)) {
    const legacyValue = await rawStorage.getItem(legacyKey);
    if (legacyValue == null) continue;

    const existing = await rawStorage.getItem(newKey);
    if (existing == null) {
      await rawStorage.setItem(newKey, legacyValue);
      migrated = true;
    }

    await rawStorage.removeItem(legacyKey);
    migrated = true;
  }

  await rawStorage.setItem(STORAGE_KEYS.storageMigrated, 'true');
  return migrated;
}
