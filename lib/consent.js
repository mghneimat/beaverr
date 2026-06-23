import { getData, setData, clearAllData } from './storage';

export const CONSENT_STORAGE_KEY = 'beaverr_consent';

/**
 * @returns {Promise<boolean>}
 */
export async function isConsentAccepted() {
  const consent = await getData(CONSENT_STORAGE_KEY);
  return consent?.accepted === true;
}

/**
 * @returns {Promise<void>}
 */
export async function saveConsent() {
  await setData(CONSENT_STORAGE_KEY, {
    accepted: true,
    acceptedAt: new Date().toISOString(),
  });
}

/**
 * @returns {Promise<void>}
 */
export async function revokeConsent() {
  await clearAllData();
}
