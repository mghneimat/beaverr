/**
 * Daily / inter-cycle spending policy — what happens to unspent daily allowance.
 * @typedef {'spendingBoost'|'looseMoney'|'savings'} DailySpendingDestination
 */

/** @type {DailySpendingDestination} */
export const DEFAULT_DAILY_SPENDING_DESTINATION = 'spendingBoost';

/** @type {{ id: DailySpendingDestination }[]} */
export const DAILY_SPENDING_STRATEGIES = [
  { id: 'spendingBoost' },
  { id: 'looseMoney' },
  { id: 'savings' },
];

/**
 * @param {import('./schema').Budget|null|undefined} budget
 * @returns {DailySpendingDestination}
 */
export function resolveDailySpendingDestination(budget) {
  return normalizeDailySpendingDestination(budget?.dailyJarDestination);
}

/**
 * @param {string|null|undefined} dest
 * @returns {DailySpendingDestination}
 */
export function normalizeDailySpendingDestination(dest) {
  if (dest === 'looseMoney' || dest === 'savings') return dest;
  if (dest === 'activity') return 'spendingBoost';
  return DEFAULT_DAILY_SPENDING_DESTINATION;
}

/**
 * @param {DailySpendingDestination} destination
 * @returns {boolean}
 */
export function keepsDailyUnderspendInPool(destination) {
  return destination === 'spendingBoost';
}
