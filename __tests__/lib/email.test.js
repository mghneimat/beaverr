import { normalizeEmail, isValidEmail } from '../../lib/auth/email';

describe('email', () => {
  describe('normalizeEmail', () => {
    it('trims and lowercases', () => {
      expect(normalizeEmail('  User@Example.COM  ')).toBe('user@example.com');
    });
  });

  describe('isValidEmail', () => {
    it('accepts common valid addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('  Anna.Test+tag@mail.co.uk  ')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('spaces @here.com')).toBe(false);
    });
  });
});
