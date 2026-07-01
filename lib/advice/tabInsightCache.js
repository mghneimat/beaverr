import { buildTabSnapshot, hashTabSnapshot } from './buildTabSnapshot.js';

/** @typedef {'ready'|'empty'|'error'} TabInsightCacheStatus */

/**
 * @typedef {{
 *   snapshotKey: string,
 *   locale: string,
 *   paragraphs: string[],
 *   status: TabInsightCacheStatus,
 * }} TabInsightCacheEntry
 */

/** @type {Map<string, TabInsightCacheEntry>} */
const sessionCache = new Map();

/**
 * Stable fingerprint for the tab-scoped advice payload.
 * @param {import('./buildTabSnapshot.js').TabAdviceKey} tabKey
 * @param {import('../householdBudget').HouseholdFinancials|null|undefined} financials
 * @param {string} locale
 * @param {object} [helpers]
 * @returns {string|null}
 */
export function buildTabInsightSnapshotKey(tabKey, financials, locale, helpers = {}) {
  if (!financials) return null;
  const { snapshot } = buildTabSnapshot(tabKey, { financials, locale, helpers });
  return hashTabSnapshot(snapshot);
}

/**
 * @param {string} tabKey
 * @param {string|null} snapshotKey
 * @param {string} locale
 * @returns {TabInsightCacheEntry|null}
 */
export function readTabInsightCache(tabKey, snapshotKey, locale) {
  if (!snapshotKey) return null;
  const entry = sessionCache.get(tabKey);
  if (!entry) return null;
  if (entry.snapshotKey !== snapshotKey || entry.locale !== locale) return null;
  return entry;
}

/**
 * @param {string} tabKey
 * @param {TabInsightCacheEntry} entry
 */
export function writeTabInsightCache(tabKey, entry) {
  sessionCache.set(tabKey, entry);
}

export function clearTabInsightCache() {
  sessionCache.clear();
}

/**
 * @param {string} tabKey
 */
export function clearTabInsightCacheForTab(tabKey) {
  sessionCache.delete(tabKey);
}
