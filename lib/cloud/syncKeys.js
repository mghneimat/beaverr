import { ALL_CLEARABLE_STORAGE_KEYS, STORAGE_KEYS } from '../beaverrConstants.js';

/** Keys mirrored to Supabase household_data.data — excludes local-only meta. */
export const SYNCABLE_STORAGE_KEYS = ALL_CLEARABLE_STORAGE_KEYS.filter(
  (key) => key !== STORAGE_KEYS.storageMigrated,
);

export const SYNC_META_STORAGE_KEY = STORAGE_KEYS.syncMeta;
