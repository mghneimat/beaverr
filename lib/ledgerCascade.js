import { committedMonthlyLoad } from './finance';
import {
  GOAL_TYPES,
  getMonthlySavingsReservation,
  goalTypeIncludesSaving,
  normalizeIncomeGoalFields,
} from './incomeGoals';
import { computeCostReduction } from './costReductionProgress';

/** Minimum available after committed costs before showing the savings shift slider */
export const UNALLOCATED_SLIDER_MIN = 500;

/**
 * @typedef {Object} LedgerCascade
 * @property {number} income
 * @property {number} committed
 * @property {number} available
 * @property {boolean} isOvercommitted
 * @property {number} saved
 * @property {boolean} showSaved
 * @property {boolean} deductSavingsGoal
 * @property {boolean} savedIsInformational
 * @property {number} costReduction
 * @property {boolean} showCostReduction
 * @property {number} toSpend
 * @property {number} unallocated
 * @property {boolean} showUnallocated
 * @property {boolean} showUnallocatedSlider
 */

/**
 * Build the monthly plan ledger cascade for the dashboard.
 * @param {import('./householdBudget').HouseholdFinancials} financials
 * @param {{ goalGap?: { monthlyRequired?: number }|null }} [insights]
 * @returns {LedgerCascade}
 */
export function buildLedgerCascade(financials, insights = {}) {
  const income = Number(financials.totalIncome) || 0;
  const committed = committedMonthlyLoad(financials);
  const available = Number(financials.availableBudget) || 0;
  const isOvercommitted = available < 0;

  const { goalType } = normalizeIncomeGoalFields(financials.income);
  const goalGap = insights.goalGap ?? null;
  const saved = getMonthlySavingsReservation(financials.income, goalGap);
  const deductSavingsGoal = financials.deductSavingsGoal === true;
  const toSpend = Number(financials.effectiveMonthlyFlexible ?? financials.monthlyFlexible) || 0;

  const showSaved = goalTypeIncludesSaving(goalType) && saved > 0;
  const savedIsInformational = showSaved && !deductSavingsGoal;

  const { reduced, hasBaseline } = computeCostReduction(financials);
  const showCostReduction = goalType === GOAL_TYPES.REDUCE_COSTS
    || goalType === GOAL_TYPES.REDUCE_AND_SAVE;

  let unallocated;
  if (deductSavingsGoal && showSaved) {
    unallocated = available - saved - toSpend;
  } else {
    unallocated = available - toSpend;
  }

  const showUnallocated = !isOvercommitted && unallocated > 0;
  // Keep slider visible at full spending so the user can shift back toward savings.
  const showUnallocatedSlider = !isOvercommitted
    && available >= UNALLOCATED_SLIDER_MIN
    && goalTypeIncludesSaving(goalType);

  return {
    income,
    committed,
    available,
    isOvercommitted,
    saved,
    showSaved,
    deductSavingsGoal,
    savedIsInformational,
    costReduction: hasBaseline ? reduced : 0,
    showCostReduction,
    toSpend,
    unallocated,
    showUnallocated,
    showUnallocatedSlider,
  };
}
