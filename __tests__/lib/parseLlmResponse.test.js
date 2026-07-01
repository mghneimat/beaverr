import {
  allowedNumbersFromFixture,
  extractNumbersFromText,
  narrativeText,
  parseLlmResponseJson,
  validateNumbersInNarrative,
} from '../../lib/advice/parseLlmResponse';
import { narrativeToParagraphs } from '../../lib/advice/narrativeToParagraphs';

const FOUR_PARAS = [
  'Your surplus of 2 000 CZK each month is a thin but real margin — that is more than many households at this income level manage, and it means you are not running a monthly deficit despite tight fixed costs.',
  'Fixed costs at 79% of take-home leave almost no room before anything unexpected hits, and that ratio is the main structural pressure on this budget right now.',
  'This week, list every subscription and recurring charge on your bank statement and cancel one you have not used in the past 30 days — one dormant charge is enough to start.',
  'Groceries are bundled with fixed costs in this plan, so your flex bucket may be smaller than it looks on paper when you mentally separate food from other variable spending.',
];

describe('parseLlmResponse', () => {
  test('parses valid 4-paragraph narrative JSON', () => {
    const raw = JSON.stringify({ paragraphs: FOUR_PARAS });
    const result = parseLlmResponseJson(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.narrative.paragraphs).toHaveLength(4);
    }
  });

  test('parses sparse single-paragraph response', () => {
    const sparse =
      'I can see your monthly income and your fixed costs in the data, but without debt balances, savings totals, or goal progress filled in, a fuller picture would let me give you something more useful than a rough guess about where you stand financially right now.';
    const raw = JSON.stringify({ paragraphs: [sparse] });
    const result = parseLlmResponseJson(raw);
    expect(result.ok).toBe(true);
  });

  test('rejects legacy headline/bullets schema', () => {
    const raw = JSON.stringify({
      headline: 'Tight budget',
      bullets: ['Review fixed costs'],
    });
    const result = parseLlmResponseJson(raw);
    expect(result.ok).toBe(false);
  });

  test('rejects wrong paragraph count', () => {
    const raw = JSON.stringify({ paragraphs: ['One', 'Two'] });
    expect(parseLlmResponseJson(raw).ok).toBe(false);
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
      paragraphs: ['Příjem 95 000 CZK, fixní 42 000 CZK, přebytek 33 000 CZK.'],
    };
    const allowed = allowedNumbersFromFixture(fixture);
    expect(validateNumbersInNarrative(narrative, allowed).ok).toBe(true);
  });

  test('narrativeText joins paragraphs', () => {
    const narrative = { paragraphs: ['A', 'B'] };
    expect(narrativeText(narrative)).toBe('A B');
  });

  test('narrativeToParagraphs falls back to v2 headline + bullets', () => {
    const paragraphs = narrativeToParagraphs({
      headline: 'Tight margin',
      bullets: ['Review fixed costs', 'Track subscriptions'],
    });
    expect(paragraphs).toEqual(['Tight margin', 'Review fixed costs', 'Track subscriptions']);
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
