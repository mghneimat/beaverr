import { getData, setData } from './storage';
import { committedMonthlyLoad } from './finance';

/**
 * @typedef {Object} CostReductionProgress
 * @property {number|null} baseline - Committed monthly total at baseline snapshot
 * @property {number} current - Current committed monthly total
 * @property {number} reduced - Non-negative reduction vs baseline
 * @property {boolean} hasBaseline
 */

/**
 * @param {import('./householdBudget').HouseholdFinancials} financials
 * @returns {CostReductionProgress}
 */
export function computeCostReduction(financials) {
  const current = committedMonthlyLoad(financials);
  const rawBaseline = financials.budget?.committedBaseline;
  const baseline = rawBaseline != null && Number.isFinite(Number(rawBaseline))
    ? Number(rawBaseline)
    : null;

  if (baseline == null || baseline <= 0) {
    return { baseline: null, current, reduced: 0, hasBaseline: false };
  }

  return {
    baseline,
    current,
    reduced: Math.max(0, baseline - current),
    hasBaseline: true,
  };
}

/**
 * Persist committed baseline on first run (existing users) or when missing.
 * @param {import('./householdBudget').HouseholdFinancials} financials
 * @returns {Promise<number>} Baseline committed monthly total
 */
export async function ensureCommittedBaseline(financials) {
  const budget = financials.budget || {};
  const existing = budget.committedBaseline;
  if (existing != null && Number.isFinite(Number(existing))) {
    return Number(existing);
  }

  const committed = committedMonthlyLoad(financials);
  const updated = { ...budget, committedBaseline: committed };
  await setData('beaverr_budget', updated);
  return committed;
}

/**
 * Snapshot committed baseline when onboarding completes.
 * @param {number} committedMonthly
 */
export async function snapshotCommittedBaseline(committedMonthly) {
  const budget = (await getData('beaverr_budget')) || {};
  if (budget.committedBaseline != null && Number.isFinite(Number(budget.committedBaseline))) {
    return Number(budget.committedBaseline);
  }
  const committed = Math.max(0, Number(committedMonthly) || 0);
  await setData('beaverr_budget', { ...budget, committedBaseline: committed });
  return committed;
}
