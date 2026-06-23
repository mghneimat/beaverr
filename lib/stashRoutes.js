/**
 * Encode/decode savings stash line ids for Expo Router dynamic segments.
 * Custom tabs use ids like `stash:uuid` which must be URL-encoded.
 */

/**
 * @param {string|null|undefined} stashId
 * @returns {string}
 */
export function encodeStashRouteId(stashId) {
  return encodeURIComponent(String(stashId ?? ''));
}

/**
 * @param {string|null|undefined} encoded
 * @returns {string}
 */
export function decodeStashRouteId(encoded) {
  if (encoded == null || encoded === '') return '';
  try {
    return decodeURIComponent(String(encoded));
  } catch {
    return String(encoded);
  }
}
