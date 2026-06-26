import { getSupabase } from '../supabase.js';

/**
 * @typedef {{
 *   householdId: string,
 *   data: Record<string, unknown>,
 *   version: number,
 *   updatedAt: string,
 * }} HouseholdRecord
 */

/**
 * @param {string} userId
 * @returns {Promise<HouseholdRecord | null>}
 */
export async function getHouseholdForUser(userId) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('households')
    .select('id, household_data(data, version, updated_at)')
    .eq('owner_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  const row = data.household_data;
  return {
    householdId: data.id,
    data: (row?.data && typeof row.data === 'object') ? row.data : {},
    version: row?.version ?? 1,
    updatedAt: row?.updated_at ?? new Date(0).toISOString(),
  };
}

/**
 * @param {string} userId
 * @param {string} [locale]
 * @returns {Promise<HouseholdRecord>}
 */
export async function ensureHouseholdExists(userId, locale = 'en') {
  const existing = await getHouseholdForUser(userId);
  if (existing) return existing;

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('supabase_not_configured');
  }

  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ owner_id: userId })
    .select('id')
    .single();

  if (householdError) {
    const retry = await getHouseholdForUser(userId);
    if (retry) return retry;
    throw new Error(householdError.message);
  }

  const { error: dataError } = await supabase
    .from('household_data')
    .insert({ household_id: household.id, data: {} });

  if (dataError) {
    throw new Error(dataError.message);
  }

  await supabase
    .from('profiles')
    .upsert({ id: userId, locale }, { onConflict: 'id' });

  return {
    householdId: household.id,
    data: {},
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * @param {string} householdId
 * @param {Record<string, unknown>} dataBlob
 * @param {number} [currentVersion]
 * @returns {Promise<{ version: number, updatedAt: string }>}
 */
export async function upsertHouseholdData(householdId, dataBlob, currentVersion = 0) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('supabase_not_configured');
  }

  const nextVersion = currentVersion + 1;
  const updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from('household_data')
    .upsert({
      household_id: householdId,
      data: dataBlob,
      version: nextVersion,
      updated_at: updatedAt,
    }, { onConflict: 'household_id' })
    .select('version, updated_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    version: data.version,
    updatedAt: data.updated_at,
  };
}

/**
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
export async function getProfileUsername(userId) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('getProfileUsername failed:', error.message);
    return null;
  }

  const username = data?.username;
  return typeof username === 'string' && username.trim() ? username.trim() : null;
}

/**
 * @param {string} userId
 * @param {string} locale
 * @returns {Promise<void>}
 */
export async function updateProfileLocale(userId, locale) {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase
    .from('profiles')
    .update({ locale, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

/**
 * @param {string} userId
 * @param {string} username — already normalized
 * @param {string} [locale]
 * @returns {Promise<{ ok: true } | { ok: false, reason: 'taken' | 'error' }>}
 */
export async function claimProfileUsername(userId, username, locale) {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, reason: 'error' };
  }

  const row = {
    id: userId,
    username,
    updated_at: new Date().toISOString(),
    ...(locale ? { locale } : null),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select('username')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, reason: 'taken' };
    }
    return { ok: false, reason: 'error' };
  }

  if (!data?.username || data.username.toLowerCase() !== username.toLowerCase()) {
    return { ok: false, reason: 'error' };
  }

  return { ok: true };
}
