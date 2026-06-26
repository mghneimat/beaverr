/** Practical email format check — not full RFC validation. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {string} value
 * @returns {string}
 */
export function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  const normalized = normalizeEmail(value);
  if (!normalized) return false;
  return EMAIL_PATTERN.test(normalized);
}
