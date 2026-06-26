import {
  ADVICE_FOCUS_AREAS,
  ADVICE_MAX_BULLETS,
  ADVICE_MAX_WORDS,
  KNOWN_RULE_IDS,
} from '../../constants.js';
import {
  allowedNumbersFromFixture,
  parseLlmResponseJson,
  validateCitationsUsed,
  validateNumbersInNarrative,
} from '../../parseLlmResponse.js';

const EN_MARKERS = /\b(the|your|you should|consider|budget|income|expenses)\b/i;
const CS_MARKERS = /[áčďéěíňóřšťúůýž]/i;

const INVESTMENT_DENYLIST = /\b(etf|stock|crypto|bitcoin|broker|mutual fund|akci|kryptoměn)\b/i;

/**
 * @param {string} fixtureId
 * @param {object} fixture
 * @param {string} rawLlmText
 * @param {{ kbChunkIds?: string[] }} [opts]
 * @returns {{ id: string, pass: boolean, results: object[] }}
 */
export function runMechanicalAssertions(fixtureId, fixture, rawLlmText, opts = {}) {
  const kbChunkIds = opts.kbChunkIds || [];
  const results = [];

  const m1 = parseLlmResponseJson(rawLlmText);
  results.push(assertResult('M1', 'valid_json_schema', m1.ok, m1.ok ? '' : m1.error));

  if (!m1.ok) {
    return { id: fixtureId, pass: false, results };
  }

  const narrative = m1.narrative;

  results.push(assertResult(
    'M2',
    'focus_area_enum',
    ADVICE_FOCUS_AREAS.includes(narrative.focus_area),
    narrative.focus_area,
  ));

  const citations = validateCitationsUsed(narrative, kbChunkIds);
  results.push(assertResult(
    'M3',
    'citations_subset',
    citations.ok,
    citations.ok ? JSON.stringify(narrative.citations_used) : citations.error,
  ));

  const allowed = allowedNumbersFromFixture(fixture);
  const numbers = validateNumbersInNarrative(narrative, allowed);
  results.push(assertResult('M4', 'numbers_from_input', numbers.ok, numbers.ok ? '' : numbers.error));

  const text = [narrative.headline, ...narrative.bullets].join(' ');
  const piiOk = !INVESTMENT_DENYLIST.test(text);
  results.push(assertResult('M5', 'no_investment_denylist', piiOk, ''));

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const m6Ok = narrative.bullets.length <= ADVICE_MAX_BULLETS && wordCount <= ADVICE_MAX_WORDS;
  results.push(assertResult('M6', 'length_cap', m6Ok, `bullets=${narrative.bullets.length} words=${wordCount}`));

  if (fixtureId === 'overcommitted_high_apr_en') {
    const lower = text.toLowerCase();
    // Reject invented debt refs (only debt_1 exists in fixture); generic "creditors" is OK
    const debtOk = !/\bdebt[_\s]?[2-9]\d*\b/i.test(text);
    results.push(assertResult('M7', 'debt_ref_only', debtOk, ''));
  }

  if (fixtureId === 'healthy_no_rules_triggered_cs') {
    const lower = text.toLowerCase();
    const ruleLeak = KNOWN_RULE_IDS.some((rid) => lower.includes(rid.replace(/_/g, ' ')) || lower.includes(rid));
    results.push(assertResult('M8', 'no_rule_ids_when_empty', !ruleLeak, ''));
  }

  const locale = fixture.locale || fixture.snapshot?.locale;
  const m9Ok = locale === 'cs' ? CS_MARKERS.test(text) && !EN_MARKERS.test(text) : !CS_MARKERS.test(text) || EN_MARKERS.test(text);
  results.push(assertResult('M9', 'locale_language', m9Ok, `locale=${locale}`));

  const pass = results.every((r) => r.pass);
  return { id: fixtureId, pass, results, narrative };
}

/**
 * @param {string} id
 * @param {string} label
 * @param {boolean} pass
 * @param {string} detail
 */
function assertResult(id, label, pass, detail) {
  return { id, label, pass, detail };
}
