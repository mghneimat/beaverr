import {
  PASSWORD_MIN_LENGTH,
  getPasswordCriteria,
  isValidPassword,
} from '../../lib/auth/password';

describe('password', () => {
  describe('getPasswordCriteria', () => {
    it('tracks each requirement independently', () => {
      expect(getPasswordCriteria('')).toEqual({
        minLength: false,
        hasLetter: false,
        hasNumber: false,
      });
      expect(getPasswordCriteria('abcdefgh')).toEqual({
        minLength: true,
        hasLetter: true,
        hasNumber: false,
      });
      expect(getPasswordCriteria('12345678')).toEqual({
        minLength: true,
        hasLetter: false,
        hasNumber: true,
      });
      expect(getPasswordCriteria('pass1234')).toEqual({
        minLength: true,
        hasLetter: true,
        hasNumber: true,
      });
    });
  });

  describe('isValidPassword', () => {
    it(`requires at least ${PASSWORD_MIN_LENGTH} characters with a letter and number`, () => {
      expect(isValidPassword('short1')).toBe(false);
      expect(isValidPassword('lettersonly')).toBe(false);
      expect(isValidPassword('12345678')).toBe(false);
      expect(isValidPassword('securePass1')).toBe(true);
    });
  });
});
