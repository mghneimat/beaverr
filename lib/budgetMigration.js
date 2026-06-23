import { normalizeDailySpendingDestination } from './dailySpendingStrategy';
import { migrateLegacyOtherGoal } from './customStashes';
import { backfillStashMovementsFromLegacyHistory } from './stashMovements';

/**
 * Policy migrations: remove daily jar + capped rollover; merge legacy activity balances into piggy bank.
 * @param {import('./schema').Budget|null|undefined} budget
 * @returns {{ budget: import('./schema').Budget, changed: boolean }}
 */
export function migrateBudgetPolicy(budget) {
  if (!budget || typeof budget !== 'object') {
    return { budget: budget || {}, changed: false };
  }

  let changed = false;
  const next = { ...budget };

  const normalizedDest = normalizeDailySpendingDestination(next.dailyJarDestination);
  if (normalizedDest !== next.dailyJarDestination) {
    next.dailyJarDestination = normalizedDest;
    changed = true;
  }

  const activityBal = Number(next.activityJarBalance) || 0;
  if (activityBal > 0) {
    next.looseMoneyBalance = (Number(next.looseMoneyBalance) || 0) + activityBal;
    next.activityJarBalance = 0;
    changed = true;
  }

  if (next.activityJarCapAmount != null) {
    next.activityJarCapAmount = null;
    changed = true;
  }

  if (next.rolloverStrategy === 'capped') {
    next.rolloverStrategy = 'free';
    changed = true;
  }

  const legacyStash = migrateLegacyOtherGoal(next);
  if (legacyStash.changed) {
    Object.assign(next, legacyStash.budget);
    changed = true;
  }

  const movementBackfill = backfillStashMovementsFromLegacyHistory(next);
  if (movementBackfill.changed) {
    Object.assign(next, movementBackfill.budget);
    changed = true;
  }

  return { budget: changed ? next : budget, changed };
}
