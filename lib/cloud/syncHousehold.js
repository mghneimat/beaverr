import { getData, setData } from '../storage.js';
import { SYNC_META_STORAGE_KEY, SYNCABLE_STORAGE_KEYS } from './syncKeys.js';
import {
  ensureHouseholdExists,
  getHouseholdForUser,
  upsertHouseholdData,
} from './householdRepository.js';
import { ensureLocalDataForUser, localSnapshotHasData } from '../auth/userDataScope.js';
import { reportClientError } from '../admin/reportError.js';

const PUSH_DEBOUNCE_MS = 2500;

/** @type {import('@supabase/supabase-js').Session | null} */
let activeSession = null;

let isHydratingFromCloud = false;

let pushTimer = null;

let pushInFlight = false;

let pendingPush = false;

/**
 * @param {import('@supabase/supabase-js').Session | null} session
 */
export function setCloudSyncSession(session) {
  activeSession = session;
  if (!session) {
    clearScheduledCloudPush();
  }
}

export function getIsHydratingFromCloud() {
  return isHydratingFromCloud;
}

export function clearScheduledCloudPush() {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  pendingPush = false;
}

/**
 * @returns {Promise<Record<string, unknown>>}
 */
export async function collectLocalSnapshot() {
  const entries = await Promise.all(
    SYNCABLE_STORAGE_KEYS.map(async (key) => {
      const value = await getData(key);
      return [key, value];
    }),
  );

  /** @type {Record<string, unknown>} */
  const snapshot = {};
  for (const [key, value] of entries) {
    if (value != null) {
      snapshot[key] = value;
    }
  }
  return snapshot;
}

/**
 * @param {boolean} hydrating
 */
export function setHydratingFromCloud(hydrating) {
  isHydratingFromCloud = hydrating;
}

/**
 * @param {Record<string, unknown>} blob
 * @returns {Promise<void>}
 */
export async function hydrateLocalFromSnapshot(blob) {
  setHydratingFromCloud(true);
  try {
    await Promise.all(
      SYNCABLE_STORAGE_KEYS.map(async (key) => {
        if (Object.prototype.hasOwnProperty.call(blob, key)) {
          const value = blob[key];
          if (value != null) {
            await setData(key, value);
          }
        }
      }),
    );
  } finally {
    setHydratingFromCloud(false);
  }
}

/**
 * @param {import('@supabase/supabase-js').Session} session
 * @returns {Promise<{ ok: true, action: 'pulled' | 'noop' | 'scoped', householdId: string } | { ok: false, error: string }>}
 */
export async function pullCloudHousehold(session) {
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: 'no_user' };
  }

  try {
    const scope = await ensureLocalDataForUser(userId);
    if (scope.action !== 'noop') {
      // Local data was cleared or re-bound — never push stale device data to a new account.
      if (scope.action === 'cleared_stale_local' || scope.action === 'switched_user') {
        let record = await getHouseholdForUser(userId);
        if (!record) {
          record = await ensureHouseholdExists(userId);
        }
        await setData(SYNC_META_STORAGE_KEY, {
          householdId: record.householdId,
          lastPulledAt: null,
          lastPushedAt: null,
          version: record.version,
        });
        return { ok: true, action: 'scoped', householdId: record.householdId };
      }
    }

    let record = await getHouseholdForUser(userId);
    if (!record) {
      record = await ensureHouseholdExists(userId);
    }

    const syncMeta = await getData(SYNC_META_STORAGE_KEY);
    const remoteUpdatedAt = new Date(record.updatedAt).getTime();
    const lastPulledAt = syncMeta?.lastPulledAt
      ? new Date(syncMeta.lastPulledAt).getTime()
      : 0;
    const remoteHasData = Object.keys(record.data || {}).length > 0;

    if (remoteHasData && remoteUpdatedAt > lastPulledAt) {
      await hydrateLocalFromSnapshot(record.data);
      await setData(SYNC_META_STORAGE_KEY, {
        householdId: record.householdId,
        lastPulledAt: record.updatedAt,
        lastPushedAt: syncMeta?.lastPushedAt ?? null,
        version: record.version,
      });
      return { ok: true, action: 'pulled', householdId: record.householdId };
    }

    await setData(SYNC_META_STORAGE_KEY, {
      householdId: record.householdId,
      lastPulledAt: syncMeta?.lastPulledAt ?? record.updatedAt,
      lastPushedAt: syncMeta?.lastPushedAt ?? null,
      version: record.version,
    });

    return { ok: true, action: 'noop', householdId: record.householdId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'pull_failed';
    reportClientError({ severity: 'blocker', category: 'sync', message, context: { phase: 'pull' } });
    return { ok: false, error: message };
  }
}

/**
 * @param {import('@supabase/supabase-js').Session} [session]
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function pushCloudHousehold(session = activeSession) {
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: 'no_user' };
  }

  if (pushInFlight) {
    pendingPush = true;
    return { ok: true };
  }

  pushInFlight = true;
  try {
    let record = await getHouseholdForUser(userId);
    if (!record) {
      record = await ensureHouseholdExists(userId);
    }

    const snapshot = await collectLocalSnapshot();
    const result = await upsertHouseholdData(
      record.householdId,
      snapshot,
      record.version,
    );

    await setData(SYNC_META_STORAGE_KEY, {
      householdId: record.householdId,
      lastPulledAt: (await getData(SYNC_META_STORAGE_KEY))?.lastPulledAt ?? null,
      lastPushedAt: result.updatedAt,
      version: result.version,
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'push_failed';
    reportClientError({ severity: 'error', category: 'sync', message, context: { phase: 'push' } });
    return { ok: false, error: message };
  } finally {
    pushInFlight = false;
    if (pendingPush) {
      pendingPush = false;
      scheduleCloudPush();
    }
  }
}

export function scheduleCloudPush() {
  if (isHydratingFromCloud || !activeSession?.user?.id) {
    return;
  }

  if (pushTimer) {
    clearTimeout(pushTimer);
  }

  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushCloudHousehold(activeSession).catch((error) => {
      console.error('Cloud sync push failed:', error);
      reportClientError({
        severity: 'error',
        category: 'sync',
        message: error instanceof Error ? error.message : 'push_failed',
        context: { phase: 'push_scheduled' },
      });
    });
  }, PUSH_DEBOUNCE_MS);
}

/**
 * @returns {Promise<string | null>}
 */
export async function getLinkedHouseholdId() {
  const meta = await getData(SYNC_META_STORAGE_KEY);
  return meta?.householdId ?? null;
}
