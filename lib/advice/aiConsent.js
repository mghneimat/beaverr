import { getData, setData } from '../storage.js';
import { STORAGE_KEYS } from '../beaverrConstants.js';

export const AI_CONSENT_STORAGE_KEY = STORAGE_KEYS.aiConsent;

/**
 * @returns {Promise<boolean>}
 */
export async function isAiConsentAccepted() {
  const consent = await getData(AI_CONSENT_STORAGE_KEY);
  return consent?.accepted === true;
}

/**
 * @returns {Promise<void>}
 */
export async function saveAiConsent() {
  await setData(AI_CONSENT_STORAGE_KEY, {
    accepted: true,
    acceptedAt: new Date().toISOString(),
  });
}

/**
 * Withdraw AI insight consent without clearing GDPR consent.
 * @returns {Promise<void>}
 */
export async function revokeAiConsent() {
  await setData(AI_CONSENT_STORAGE_KEY, null);
}
