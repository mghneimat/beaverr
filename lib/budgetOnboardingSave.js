import { getData, setData } from './storage';
import { toMonthly, availableBudget, totalMonthlyCosts } from './finance';
import { splitFlexibleBudget, resolveBudgetSpendingRatio } from './budgetSplit';
import { asArray } from './asArray';
import { periodKey } from './dailyLog';
import {
  DEFAULT_DAILY_SPENDING_DESTINATION,
  normalizeDailySpendingDestination,
} from './dailySpendingStrategy';
import { migrateBudgetPolicy } from './budgetMigration';

/**
 * Resolve monthly flexible budget from form state or live household totals.
 * @param {object} params
 * @param {string|number} params.monthlyFlexible
 * @param {object|null} params.income
 * @param {object[]} params.costs
 * @param {object[]} params.debts
 * @returns {number}
 */
export function resolveFlexibleMonthly({ monthlyFlexible, income, costs, debts }) {
  let flex = parseFloat(monthlyFlexible);
  if (Number.isFinite(flex)) return flex;

  const userM = toMonthly(income?.amount || 0, income?.frequency || 'monthly');
  const partnerM = toMonthly(income?.partnerAmount || 0, income?.partnerFrequency || 'monthly');
  const otherM = asArray(income?.otherIncomeRows).reduce(
    (sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'),
    0,
  );
  return availableBudget(
    userM + partnerM + otherM,
    totalMonthlyCosts(costs),
    (asArray(debts)).reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0),
  );
}

/**
 * Persist flexible-budget choices from onboarding budgetSplit (before rollover step).
 * @param {object} draft
 * @returns {Promise<void>}
 */
export async function persistBudgetSplitDraft(draft) {
  const flex = resolveFlexibleMonthly(draft);
  const { spendingMonthly, savingsShift, ratio } = splitFlexibleBudget(flex, draft.budgetSpendingRatio);
  const existing = (await getData('beaverr_budget')) || {};

  await setData('beaverr_budget', {
    ...existing,
    monthlyFlexible: spendingMonthly,
    budgetSpendingRatio: ratio,
    budgetSavingsShift: savingsShift,
    budgetDisplayFrequency: draft.budgetDisplayFrequency,
    deductSavingsGoal: draft.deductSavingsGoal === true,
    budgetOnboardingStep: 'flexible-budget',
  });
}

/**
 * Persist monthly rollover choices (rollover step) before daily spending step.
 * @param {object} draft
 * @returns {Promise<void>}
 */
export async function persistRolloverDraft(draft) {
  const strategy = draft.rolloverStrategy || 'free';
  const existing = (await getData('beaverr_budget')) || {};

  await setData('beaverr_budget', {
    ...existing,
    rolloverStrategy: strategy,
    rolloverMultiplier: null,
    rolloverCapType: null,
    rolloverCapAmount: null,
    resetUnspentDestination: strategy === 'reset' ? draft.resetUnspentDestination : null,
    resetOtherGoalNote: strategy === 'reset' && draft.resetUnspentDestination === 'otherGoal'
      ? (draft.resetOtherGoalNote?.trim() || null)
      : null,
    budgetOnboardingStep: 'spending-strategy',
  });
}

/**
 * Finalize budget during onboarding after daily spending step.
 * @param {object} draft
 * @returns {Promise<void>}
 */
export async function persistFinalBudgetOnboarding(draft) {
  const flex = resolveFlexibleMonthly(draft);
  const strategy = draft.rolloverStrategy || 'free';
  const { spendingMonthly, savingsShift, ratio } = splitFlexibleBudget(flex, draft.budgetSpendingRatio);
  const existing = (await getData('beaverr_budget')) || {};
  const { budget: migratedExisting } = migrateBudgetPolicy(existing);
  const dailyDestination = normalizeDailySpendingDestination(
    draft.dailyJarDestination ?? migratedExisting.dailyJarDestination ?? DEFAULT_DAILY_SPENDING_DESTINATION,
  );

  await setData('beaverr_budget', {
    ...migratedExisting,
    monthlyFlexible: spendingMonthly,
    budgetSpendingRatio: ratio,
    budgetSavingsShift: savingsShift,
    budgetDisplayFrequency: draft.budgetDisplayFrequency,
    rolloverStrategy: strategy,
    rolloverMultiplier: null,
    rolloverCapType: null,
    rolloverCapAmount: null,
    resetUnspentDestination: strategy === 'reset' ? draft.resetUnspentDestination : null,
    resetOtherGoalNote: strategy === 'reset' && draft.resetUnspentDestination === 'otherGoal'
      ? (draft.resetOtherGoalNote?.trim() || null)
      : null,
    rolloverBalance: migratedExisting.rolloverBalance ?? 0,
    looseMoneyBalance: migratedExisting.looseMoneyBalance ?? 0,
    otherGoalBalance: migratedExisting.otherGoalBalance ?? 0,
    activityJarBalance: 0,
    activityJarCapAmount: null,
    dailyJarEnabled: true,
    dailyJarDestination: dailyDestination,
    jarredThisMonth: migratedExisting.jarredThisMonth ?? 0,
    dayEndHistory: migratedExisting.dayEndHistory || [],
    lastClosedPeriod: migratedExisting.lastClosedPeriod || periodKey(),
    monthEndHistory: migratedExisting.monthEndHistory || [],
    deductSavingsGoal: draft.deductSavingsGoal === true,
    budgetOnboardingStep: null,
  });
}

/**
 * @param {object|null|undefined} savedBudget
 * @param {number} availableMonthly
 * @returns {number}
 */
export function resolveOnboardingSpendingRatio(savedBudget, availableMonthly) {
  if (savedBudget) {
    return resolveBudgetSpendingRatio(savedBudget, availableMonthly);
  }
  return 1;
}
