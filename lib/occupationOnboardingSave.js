/**
 * Draft persistence for occupation onboarding multi-step flow.
 */

import { STORAGE_KEYS } from './beaverrConstants';
import { getData, setData } from './storage';

/**
 * @param {import('./schema').Household|null|undefined} household
 * @returns {boolean}
 */
export function hasOccupationPartner(household) {
  return household?.type === 'partner' && Boolean(household?.partnerName);
}

/**
 * @param {Object|null|undefined} occupation
 * @param {import('./schema').Household|null|undefined} household
 * @returns {{ step: 'user'|'partner' }}
 */
export function resolveOccupationReturnPoint(occupation, household) {
  if (occupation?.occupationOnboardingStep === 'partner') {
    return { step: 'partner' };
  }

  if (hasOccupationPartner(household) && occupation?.user) {
    return { step: 'partner' };
  }

  return { step: 'user' };
}

/**
 * @param {{ hasPartner: boolean }} params
 * @returns {{ step: 'user'|'partner' }}
 */
export function computeOccupationReturnPoint({ hasPartner }) {
  return { step: hasPartner ? 'partner' : 'user' };
}

/**
 * @param {'user'|'partner'} [step]
 * @returns {string}
 */
export function buildOccupationResumeRoute(step) {
  if (!step || step === 'user') {
    return '/(onboarding)/occupation';
  }
  return `/(onboarding)/occupation?step=${encodeURIComponent(step)}`;
}

/**
 * Nav params for history when leaving occupation toward the next section.
 * @param {'user'|'partner'} [step]
 * @returns {Record<string, string>|undefined}
 */
export function occupationNavParams(step) {
  if (!step || step === 'user') return undefined;
  return { step };
}

/**
 * @param {Object} draft
 * @returns {Promise<void>}
 */
export async function persistOccupationDraft(draft) {
  const existing = (await getData(STORAGE_KEYS.occupation)) || {};
  await setData(STORAGE_KEYS.occupation, {
    ...existing,
    user: draft.userOccupation || existing.user || '',
    userOtherText: draft.userOccupation === 'other'
      ? (draft.userOtherText?.trim() || null)
      : null,
    partner: draft.hasPartner ? (draft.partnerOccupation || existing.partner || null) : null,
    partnerOtherText: draft.partnerOccupation === 'other'
      ? (draft.partnerOtherText?.trim() || null)
      : null,
    occupationOnboardingStep: draft.step,
  });
}
