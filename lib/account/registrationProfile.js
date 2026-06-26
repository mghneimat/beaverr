import { getData, setData } from '../storage.js';
import { normalizeUsername, isValidUsernameFormat, checkUsernameAvailable } from '../auth/username.js';
import { claimProfileUsername, getProfileUsername, updateProfileLocale } from '../cloud/householdRepository.js';
import { COUNTRIES } from '../locationConstants.js';
import { notifyDashboardRefresh } from '../dashboardRefresh.js';

/**
 * @param {string|null|undefined} displayName
 */
function splitDisplayName(displayName) {
  const trimmed = displayName?.trim() ?? '';
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

/**
 * @param {string} [userId]
 * @returns {Promise<{ firstName: string, lastName: string, username: string }>}
 */
export async function loadAccountRegistrationFields(userId) {
  const household = (await getData('beaverr_household')) || {};
  const settings = (await getData('beaverr_settings')) || {};
  const { firstName, lastName } = splitDisplayName(household.displayName);

  let username = typeof settings.username === 'string' ? settings.username.trim() : '';
  if (!username && userId) {
    username = (await getProfileUsername(userId)) ?? '';
  }

  return { firstName, lastName, username };
}

/**
 * @returns {Promise<{ selectedCountry: import('../locationConstants.js').Country|null, currency: string, language: string }>}
 */
export async function loadPreferenceRegistrationFields() {
  const location = (await getData('beaverr_location')) || {};
  const settings = (await getData('beaverr_settings')) || {};
  const countryCode = typeof location.country === 'string' ? location.country : '';
  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) ?? null;
  const currency = typeof location.currency === 'string' ? location.currency : (selectedCountry?.currency ?? 'CZK');
  const language = typeof settings.language === 'string' ? settings.language : 'en';

  return { selectedCountry, currency, language };
}

/**
 * @param {{
 *   firstName: string,
 *   lastName?: string,
 *   username: string,
 *   userId?: string|null,
 *   language?: string,
 * }} input
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function saveAccountRegistrationFields({
  firstName,
  lastName = '',
  username,
  userId,
  language,
}) {
  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const normalizedUsername = normalizeUsername(username);

  if (!trimmedFirst) {
    return { ok: false, error: 'required' };
  }
  if (!isValidUsernameFormat(normalizedUsername)) {
    return { ok: false, error: 'usernameInvalid' };
  }

  const settings = (await getData('beaverr_settings')) || {};
  const currentUsername = typeof settings.username === 'string'
    ? normalizeUsername(settings.username)
    : '';

  if (normalizedUsername !== currentUsername) {
    const availability = await checkUsernameAvailable(normalizedUsername);
    if (!availability.ok) {
      if (availability.reason === 'taken') return { ok: false, error: 'usernameTaken' };
      if (availability.reason === 'invalid') return { ok: false, error: 'usernameInvalid' };
      return { ok: false, error: 'usernameCheckFailed' };
    }

    if (userId) {
      const settings = (await getData('beaverr_settings')) || {};
      const locale = language || settings.language || 'en';
      const claim = await claimProfileUsername(userId, availability.username, locale);
      if (!claim.ok) {
        return { ok: false, error: claim.reason === 'taken' ? 'usernameTaken' : 'saveFailed' };
      }
    }
  }

  const displayName = [trimmedFirst, trimmedLast].filter(Boolean).join(' ') || null;
  const existingHousehold = (await getData('beaverr_household')) || {};
  await setData('beaverr_household', {
    ...existingHousehold,
    displayName,
  });

  await setData('beaverr_settings', {
    ...settings,
    username: normalizedUsername,
  });

  notifyDashboardRefresh();
  return { ok: true };
}

/**
 * @param {{
 *   countryCode: string,
 *   currency: string,
 *   language: string,
 *   userId?: string|null,
 *   setLocale?: (locale: string) => Promise<void>,
 * }} input
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function savePreferenceRegistrationFields({
  countryCode,
  currency,
  language,
  userId,
  setLocale,
}) {
  if (!countryCode || !currency || !language) {
    return { ok: false, error: 'required' };
  }

  const existingLocation = (await getData('beaverr_location')) || {};
  await setData('beaverr_location', {
    ...existingLocation,
    country: countryCode,
    currency,
  });

  const settings = (await getData('beaverr_settings')) || {};
  await setData('beaverr_settings', { ...settings, language, currency });

  if (userId) {
    await updateProfileLocale(userId, language);
  }

  if (setLocale) {
    await setLocale(language);
  }

  notifyDashboardRefresh();
  return { ok: true };
}
