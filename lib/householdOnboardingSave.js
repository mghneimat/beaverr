/**
 * Draft persistence for household onboarding multi-step flow.
 */

import { STORAGE_KEYS } from './beaverrConstants';
import { getData, setData } from './storage';

/**
 * @param {Object} draft
 * @returns {Promise<void>}
 */
export async function persistHouseholdDraft(draft) {
  const existing = (await getData(STORAGE_KEYS.household)) || {};
  await setData(STORAGE_KEYS.household, {
    ...existing,
    type: draft.householdType || existing.type || '',
    partnerName: draft.householdType === 'partner' ? (draft.partnerName || null) : null,
    children: draft.hasChildren ? (draft.children || []) : [],
    householdOnboardingStep: draft.currentStep,
    householdOnboardingChildIndex: draft.currentChildIndex ?? 0,
    numChildren: draft.numChildren,
    hasChildren: draft.hasChildren,
  });
}

/**
 * @returns {Promise<{ step?: string, childIndex?: number }>}
 */
export async function getHouseholdResumeStep() {
  const saved = await getData(STORAGE_KEYS.household);
  return resolveHouseholdReturnPoint(saved);
}

/**
 * Last household screen to reopen when navigating back from the next section.
 * @param {Object|null|undefined} household
 * @returns {{ step: string, childIndex: number }}
 */
export function resolveHouseholdReturnPoint(household) {
  if (!household) {
    return { step: 'type', childIndex: 0 };
  }

  if (household.householdOnboardingStep) {
    return {
      step: household.householdOnboardingStep,
      childIndex: household.householdOnboardingChildIndex ?? 0,
    };
  }

  return { step: 'type', childIndex: 0 };
}

/**
 * @param {Object} params
 * @param {string} params.householdType
 * @param {boolean} params.hasChildren
 * @param {number} params.numChildren
 * @returns {{ step: string, childIndex: number }}
 */
export function computeHouseholdReturnPoint({ householdType, hasChildren, numChildren }) {
  if (hasChildren && numChildren > 0) {
    return { step: 'childDetails', childIndex: numChildren - 1 };
  }
  if (householdType === 'partner') {
    return { step: 'children', childIndex: 0 };
  }
  return { step: 'type', childIndex: 0 };
}

/**
 * @param {string} step
 * @param {number} [childIndex]
 * @returns {string}
 */
export function buildHouseholdResumeRoute(step, childIndex = 0) {
  if (!step || step === 'type') {
    return '/(onboarding)/household';
  }
  const params = new URLSearchParams({ step });
  if (step === 'childDetails') {
    params.set('childIndex', String(childIndex));
  }
  return `/(onboarding)/household?${params.toString()}`;
}

/**
 * Nav params for history when leaving household toward the next section.
 * @param {string} step
 * @param {number} [childIndex]
 * @returns {Record<string, string>}
 */
export function householdNavParams(step, childIndex = 0) {
  /** @type {Record<string, string>} */
  const params = { step };
  if (step === 'childDetails') {
    params.childIndex = String(childIndex);
  }
  return params;
}
