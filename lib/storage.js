/**
 * Storage abstraction layer — Beaverr local persistence (web localStorage / native memory).
 */

import { Platform } from 'react-native';
import {
  ALL_CLEARABLE_STORAGE_KEYS,
  LEGACY_STORAGE_ALIASES,
  resolveStorageKey,
} from './beaverrConstants';
import { migrateLegacyStorageKeys } from './beaverrStorageMigration';

/**
 * @typedef {Object} StorageAdapter
 * @property {(key: string) => Promise<string|null>} getItem
 * @property {(key: string, value: string) => Promise<void>} setItem
 * @property {(key: string) => Promise<void>} removeItem
 */

/** @type {StorageAdapter} */
let storage;

if (Platform.OS === 'web') {
  storage = {
    getItem: async (key) => localStorage.getItem(key),
    setItem: async (key, value) => localStorage.setItem(key, value),
    removeItem: async (key) => localStorage.removeItem(key),
  };
} else {
  const memoryStorage = {};
  storage = {
    getItem: async (key) => memoryStorage[key] || null,
    setItem: async (key, value) => { memoryStorage[key] = value; },
    removeItem: async (key) => { delete memoryStorage[key]; },
  };
}

let migrationPromise = migrateLegacyStorageKeys(storage).catch(() => {});
let stepFieldsMigrationPromise = null;
/** @type {number} Re-entrancy guard — migrateStoredStepFields calls getData internally. */
let stepFieldsMigrationDepth = 0;

/**
 * Ensure beaverr_* keys are copied to beaverr_* before reads.
 * @returns {Promise<void>}
 */
export async function ensureStorageMigrated() {
  await migrationPromise;
  if (stepFieldsMigrationDepth > 0) {
    return;
  }
  if (!stepFieldsMigrationPromise) {
    stepFieldsMigrationPromise = (async () => {
      stepFieldsMigrationDepth += 1;
      try {
        const { migrateStoredStepFields } = await import('./onboardingStepAliases');
        await migrateStoredStepFields();
      } catch (error) {
        console.error('Error migrating onboarding step fields:', error);
      } finally {
        stepFieldsMigrationDepth -= 1;
      }
    })();
  }
  await stepFieldsMigrationPromise;
}

/**
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function getData(key) {
  await ensureStorageMigrated();
  const canonical = resolveStorageKey(key);
  try {
    let value = await storage.getItem(canonical);
    if (value == null && canonical !== key) {
      value = await storage.getItem(key);
    }
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error reading ${canonical} from storage:`, error);
    return null;
  }
}

/**
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
export async function setData(key, value) {
  await ensureStorageMigrated();
  const canonical = resolveStorageKey(key);
  try {
    await storage.setItem(canonical, JSON.stringify(value));
    if (canonical !== key) {
      await storage.removeItem(key);
    }
  } catch (error) {
    console.error(`Error writing ${canonical} to storage:`, error);
    throw error;
  }
}

/**
 * @param {string} key
 * @returns {Promise<void>}
 */
export async function removeData(key) {
  await ensureStorageMigrated();
  const canonical = resolveStorageKey(key);
  try {
    await storage.removeItem(canonical);
    if (canonical !== key) {
      await storage.removeItem(key);
    }
  } catch (error) {
    console.error(`Error removing ${canonical} from storage:`, error);
    throw error;
  }
}

/**
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  await ensureStorageMigrated();
  try {
    await Promise.all(ALL_CLEARABLE_STORAGE_KEYS.map((key) => removeData(key)));
    for (const legacyKey of Object.keys(LEGACY_STORAGE_ALIASES)) {
      await storage.removeItem(legacyKey);
    }
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}

/** @internal test helper */
export function __resetStorageMigrationForTests() {
  migrationPromise = Promise.resolve();
  stepFieldsMigrationPromise = null;
  stepFieldsMigrationDepth = 0;
}
