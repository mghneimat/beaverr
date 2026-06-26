import { getData, setData, removeData } from '../storage.js';
import { STORAGE_KEYS } from '../beaverrConstants.js';
import { claimProfileUsername } from '../cloud/householdRepository.js';
import { persistSignUpProfile } from './persistSignUpProfile.js';

/**
 * @typedef {import('../schema').PendingSignUp} PendingSignUp
 */

/**
 * @param {PendingSignUp} data
 */
export async function savePendingSignUp(data) {
  await setData(STORAGE_KEYS.pendingSignup, data);
}

export async function clearPendingSignUp() {
  await removeData(STORAGE_KEYS.pendingSignup);
}

/**
 * Finish profile + username claim after first sign-in when email confirmation delayed session.
 * @param {string} userId
 * @param {{ setLocale?: (locale: string) => Promise<void> }} [options]
 * @returns {Promise<{ completed: boolean, reason?: string }>}
 */
export async function completePendingSignUpIfAny(userId, options = {}) {
  /** @type {PendingSignUp|null} */
  const pending = await getData(STORAGE_KEYS.pendingSignup);
  if (!pending?.username) {
    return { completed: false };
  }

  const claim = await claimProfileUsername(
    userId,
    pending.username,
    pending.language ?? 'en',
  );
  if (!claim.ok) {
    return { completed: false, reason: claim.reason };
  }

  await persistSignUpProfile({ ...pending, setLocale: options.setLocale });
  await clearPendingSignUp();
  return { completed: true };
}
