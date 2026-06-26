export const PASSWORD_MIN_LENGTH = 8;

/**
 * @param {string} password
 * @returns {{ minLength: boolean, hasLetter: boolean, hasNumber: boolean }}
 */
export function getPasswordCriteria(password) {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
  };
}

/**
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  const criteria = getPasswordCriteria(password);
  return criteria.minLength && criteria.hasLetter && criteria.hasNumber;
}
