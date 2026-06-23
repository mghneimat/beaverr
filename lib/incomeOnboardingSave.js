/**
 * Draft persistence for income onboarding multi-step flow.
 */

import { STORAGE_KEYS } from './beaverrConstants';
import { normalizeOnboardingStep } from './onboardingStepAliases';
import { getData, setData } from './storage';
import { rowsToSavedPayload } from './otherIncomeCatalog';
import { normalizeOnboardingIncomeFrequency } from './otherIncomeCatalog';

/**
 * @param {Object} draft
 * @returns {Promise<void>}
 */
export async function persistIncomeDraft(draft) {
  const existing = (await getData(STORAGE_KEYS.income)) || {};
  const step = draft.step
    ? normalizeOnboardingStep('income', draft.step)
    : existing.incomeOnboardingStep;

  await setData(STORAGE_KEYS.income, {
    ...existing,
    amount: draft.incomeAmount ? parseFloat(draft.incomeAmount) : existing.amount,
    frequency: normalizeOnboardingIncomeFrequency(draft.incomeFrequency || existing.frequency),
    partnerAmount: draft.partnerIncomeAmount ? parseFloat(draft.partnerIncomeAmount) : existing.partnerAmount,
    partnerFrequency: normalizeOnboardingIncomeFrequency(draft.partnerIncomeFrequency || existing.partnerFrequency),
    otherIncomeRows: draft.otherIncomeRows?.length
      ? rowsToSavedPayload(draft.otherIncomeRows)
      : existing.otherIncomeRows,
    savingsBalance: draft.savingsBalance ? parseFloat(draft.savingsBalance) : existing.savingsBalance,
    incomeOnboardingStep: step,
  });
}

/**
 * @param {object|null|undefined} income
 * @returns {{ step: string }}
 */
export function resolveIncomeReturnPoint(income) {
  const raw = income?.incomeOnboardingStep;
  return {
    step: raw
      ? normalizeOnboardingStep('income', raw)
      : 'yourIncome',
  };
}

/**
 * @param {string} [step]
 * @returns {string}
 */
export function buildIncomeResumeRoute(step) {
  const normalized = step
    ? normalizeOnboardingStep('income', step)
    : 'yourIncome';
  return normalized && normalized !== 'yourIncome'
    ? `/(onboarding)/income?step=${encodeURIComponent(normalized)}`
    : '/(onboarding)/income';
}

/**
 * Nav params for history when leaving income toward the next section.
 * @param {string} [step]
 * @returns {Record<string, string>|undefined}
 */
export function incomeNavParams(step) {
  const normalized = step
    ? normalizeOnboardingStep('income', step)
    : undefined;
  if (!normalized || normalized === 'yourIncome') return undefined;
  return { step: normalized };
}
