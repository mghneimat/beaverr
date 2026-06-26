import { getData, setData } from '../storage.js';

const DEFAULT_LOCATION = {
  country: 'CZ',
  city: null,
  currency: 'CZK',
};

/**
 * Ensure beaverr_location exists before citizenship / permit screens (country/currency from signup or default CZ).
 * @returns {Promise<import('./schema').Location>}
 */
export async function ensureDefaultLocation() {
  const existing = await getData('beaverr_location');
  if (existing?.country && existing?.currency) {
    return existing;
  }

  const merged = {
    ...DEFAULT_LOCATION,
    ...(existing && typeof existing === 'object' ? existing : {}),
    country: existing?.country || DEFAULT_LOCATION.country,
    currency: existing?.currency || DEFAULT_LOCATION.currency,
  };

  await setData('beaverr_location', merged);
  return merged;
}
