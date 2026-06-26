import { getData, setData } from '../storage.js';

/**
 * Persist household name, location, and language after sign-up (before onboarding).
 * @param {{
 *   firstName: string,
 *   lastName?: string,
 *   username: string,
 *   countryCode: string,
 *   currency: string,
 *   language: string,
 *   setLocale?: (locale: string) => Promise<void>,
 * }} input
 */
export async function persistSignUpProfile({
  firstName,
  lastName = '',
  username,
  countryCode,
  currency,
  language,
  setLocale,
}) {
  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const displayName = [trimmedFirst, trimmedLast].filter(Boolean).join(' ') || null;

  const existingHousehold = (await getData('beaverr_household')) || {};
  await setData('beaverr_household', {
    type: existingHousehold.type || 'solo',
    displayName,
    partnerName: existingHousehold.partnerName ?? null,
    children: Array.isArray(existingHousehold.children) ? existingHousehold.children : [],
  });

  const existingLocation = (await getData('beaverr_location')) || {};
  await setData('beaverr_location', {
    ...existingLocation,
    country: countryCode,
    city: existingLocation.city ?? null,
    currency,
  });

  const settings = (await getData('beaverr_settings')) || {};
  await setData('beaverr_settings', { ...settings, language, username });

  if (setLocale) {
    await setLocale(language);
  }
}
