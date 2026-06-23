import { parseAmount, amountToString } from '../../lib/sectionEditStorage';

describe('parseAmount', () => {
  test('parses comma decimal and rounds to 2dp', () => {
    expect(parseAmount('123,456')).toBe(123.46);
    expect(parseAmount('123,45')).toBe(123.45);
  });

  test('returns null for empty input', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount(null)).toBeNull();
  });
});

describe('amountToString', () => {
  test('formats numeric values with 2dp', () => {
    expect(amountToString(200)).toBe('200,00');
    expect(amountToString(123.4)).toBe('123,40');
  });

  test('returns empty string for null', () => {
    expect(amountToString(null)).toBe('');
  });

  test('blur round-trip preserves whole amounts (regression: strip-non-digits must not run on formatted value)', () => {
    const blurred = amountToString(parseAmount('1941'));
    expect(blurred).toBe('1941,00');
    expect(parseAmount(blurred)).toBe(1941);
  });
});
