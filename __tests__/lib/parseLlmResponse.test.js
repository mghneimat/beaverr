import {
  allowedNumbersFromFixture,
  extractNumbersFromText,
  parseLlmResponseJson,
  validateCitationsUsed,
  validateNarrativeFidelity,
  validateNumbersInNarrative,
} from '../../lib/advice/parseLlmResponse';

describe('parseLlmResponse', () => {
  test('parses valid narrative JSON', () => {
    const raw = JSON.stringify({
      headline: 'Tight budget',
      bullets: ['Review fixed costs', 'Track spending'],
      focus_area: 'budget',
      citations_used: [],
    });
    const result = parseLlmResponseJson(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.narrative.focus_area).toBe('budget');
    }
  });

  test('rejects citations when KB empty', () => {
    const narrative = {
      headline: 'Test',
      bullets: ['A'],
      focus_area: 'budget',
      citations_used: ['fake_source'],
    };
    expect(validateCitationsUsed(narrative, []).ok).toBe(false);
  });

  test('rejects rule ids in citations_used', () => {
    const narrative = {
      headline: 'Test',
      bullets: ['A'],
      focus_area: 'budget',
      citations_used: ['overcommitted'],
    };
    expect(validateCitationsUsed(narrative, []).ok).toBe(false);
  });

  test('extractNumbersFromText parses spaced thousands', () => {
    const nums = extractNumbersFromText('Příjem 95 000 CZK a přebytek 33 000 CZK');
    expect(nums).toContain(95000);
    expect(nums).toContain(33000);
    expect(nums).not.toContain(95);
  });

  test('validateNumbersInNarrative accepts fixture amounts in prose', () => {
    const fixture = {
      snapshot: {
        ledger: { income_m: 95000, fixed_m: 42000, surplus_m: 33000 },
      },
      triggered_rules: [],
    };
    const narrative = {
      headline: 'OK',
      bullets: ['Příjem 95 000 CZK, fixní 42 000 CZK, přebytek 33 000 CZK.'],
      focus_area: 'budget',
      citations_used: [],
    };
    const allowed = allowedNumbersFromFixture(fixture);
    expect(validateNumbersInNarrative(narrative, allowed).ok).toBe(true);
  });

  test('allowedNumbersFromFixture includes derived fixed+debt total', () => {
    const fixture = {
      snapshot: { ledger: { fixed_m: 29000, debt_m: 11000, income_m: 38000 } },
      triggered_rules: [],
    };
    const allowed = allowedNumbersFromFixture(fixture);
    expect(allowed.has(40000)).toBe(true);
  });
});
