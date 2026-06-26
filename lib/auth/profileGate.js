import { getData } from '../storage.js';
import { getProfileUsername } from '../cloud/householdRepository.js';

/**
 * Profile is complete when cloud username exists (or local settings mirror after persist).
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function hasCompletedProfile(userId) {
  const cloudUsername = await getProfileUsername(userId);
  if (cloudUsername) return true;

  const settings = await getData('beaverr_settings');
  const localUsername = settings?.username;
  return typeof localUsername === 'string' && localUsername.trim().length > 0;
}
