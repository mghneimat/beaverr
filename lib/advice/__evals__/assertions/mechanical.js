import {
  ADVICE_COACH_PARAGRAPHS,
  ADVICE_MAX_WORDS,
  ADVICE_MIN_WORDS,
  ADVICE_SPARSE_MAX_WORDS,
  ADVICE_SPARSE_MIN_WORDS,
  KNOWN_RULE_IDS,
} from '../../constants.js';
import {
  allowedNumbersFromFixture,
  narrativeText,
  parseLlmResponseJson,
  validateNumbersInNarrative,
} from '../../parseLlmResponse.js';

const EN_MARKERS = /\b(the|your|you should|consider|budget|income|expenses)\b/i;
const CS_MARKERS = /[áčďéěíňóřšťúůýž]/i;

const INVESTMENT_DENYLIST = /\b(etf|stock|crypto|bitcoin|broker|mutual fund|akci|kryptoměn)\b/i;

const SOURCE_NAME_DENYLIST =
  /\b(sethi|ramit|cfpb|dacyczyn|tightwad|your money or your life|millionaire next door|conscious spending)\b/i;

/**
 * @param {string} fixtureId
 * @param {object} fixture
 * @param {string} rawLlmText
 * @returns {{ id: string, pass: boolean, results: object[], narrative?: object }}
 */
export function runMechanicalAssertions(fixtureId, fixture, rawLlmText) {
  const results = [];

  const m1 = parseLlmResponseJson(rawLlmText);
  results.push(assertResult('M1', 'valid_json_schema', m1.ok, m1.ok ? '' : m1.error));

  if (!m1.ok) {
    return { id: fixtureId, pass: false, results };
  }

  const narrative = m1.narrative;
  const text = narrativeText(narrative);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const paragraphCount = narrative.paragraphs.length;

  const m2Ok =
    paragraphCount === ADVICE_COACH_PARAGRAPHS ||
    (paragraphCount === 1 && wordCount >= ADVICE_SPARSE_MIN_WORDS && wordCount <= ADVICE_SPARSE_MAX_WORDS);
  results.push(assertResult(
    'M2',
    'paragraph_count',
    m2Ok,
    `paragraphs=${paragraphCount} words=${wordCount}`,
  ));

  const allowed = allowedNumbersFromFixture(fixture);
  const numbers = validateNumbersInNarrative(narrative, allowed);
  results.push(assertResult('M4', 'numbers_from_input', numbers.ok, numbers.ok ? '' : numbers.error));

  const piiOk = !INVESTMENT_DENYLIST.test(text);
  results.push(assertResult('M5', 'no_investment_denylist', piiOk, ''));

  const m6Ok =
    paragraphCount === 1
      ? wordCount >= ADVICE_SPARSE_MIN_WORDS && wordCount <= ADVICE_SPARSE_MAX_WORDS
      : wordCount >= ADVICE_MIN_WORDS && wordCount <= ADVICE_MAX_WORDS;
  results.push(assertResult('M6', 'length_cap', m6Ok, `paragraphs=${paragraphCount} words=${wordCount}`));

  const noSourceNames = !SOURCE_NAME_DENYLIST.test(text);
  results.push(assertResult('M7', 'no_source_names', noSourceNames, ''));

  if (fixtureId === 'overcommitted_high_apr_en') {
    const debtOk = !/\bdebt[_\s]?[2-9]\d*\b/i.test(text);
    results.push(assertResult('M8', 'debt_ref_only', debtOk, ''));
  }

  if (fixtureId === 'healthy_no_rules_triggered_cs') {
    const lower = text.toLowerCase();
    const ruleLeak = KNOWN_RULE_IDS.some((rid) => lower.includes(rid.replace(/_/g, ' ')) || lower.includes(rid));
    results.push(assertResult('M9', 'no_rule_ids_when_empty', !ruleLeak, ''));
  }

  const locale = fixture.locale || fixture.snapshot?.locale;
  const m10Ok = locale === 'cs' ? CS_MARKERS.test(text) && !EN_MARKERS.test(text) : !CS_MARKERS.test(text) || EN_MARKERS.test(text);
  results.push(assertResult('M10', 'locale_language', m10Ok, locale || ''));

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
