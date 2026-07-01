import {
  ADVICE_COACH_PARAGRAPHS,
  ADVICE_MAX_WORDS,
  ADVICE_MIN_WORDS,
  ADVICE_OUTPUT_SCHEMA_KEYS,
  ADVICE_SPARSE_MAX_WORDS,
  ADVICE_SPARSE_MIN_WORDS,
} from './constants.js';

/**
 * @param {unknown} raw
 * @returns {{ ok: true, narrative: { paragraphs: string[] } } | { ok: false, error: string }}
 */
export function parseLlmResponseJson(raw) {
  let parsed = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const toParse = jsonBlock ? jsonBlock[1].trim() : trimmed;
    try {
      parsed = JSON.parse(toParse);
    } catch {
      return { ok: false, error: 'invalid_json' };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'not_object' };
  }

  for (const key of ADVICE_OUTPUT_SCHEMA_KEYS) {
    if (!(key in parsed)) {
      return { ok: false, error: `missing_key:${key}` };
    }
  }

  if (!Array.isArray(parsed.paragraphs) || parsed.paragraphs.length === 0) {
    return { ok: false, error: 'invalid_paragraphs' };
  }

  const count = parsed.paragraphs.length;
  if (count !== ADVICE_COACH_PARAGRAPHS && count !== 1) {
    return { ok: false, error: 'invalid_paragraph_count' };
  }

  if (!parsed.paragraphs.every((p) => typeof p === 'string' && p.trim())) {
    return { ok: false, error: 'invalid_paragraph_item' };
  }

  const paragraphs = parsed.paragraphs.map((p) => p.trim());
  const wordCount = countWords(...paragraphs);

  if (count === 1) {
    if (wordCount < ADVICE_SPARSE_MIN_WORDS || wordCount > ADVICE_SPARSE_MAX_WORDS) {
      return { ok: false, error: 'sparse_word_count_out_of_range' };
    }
  } else if (wordCount < ADVICE_MIN_WORDS || wordCount > ADVICE_MAX_WORDS) {
    return { ok: false, error: 'word_count_out_of_range' };
  }

  return {
    ok: true,
    narrative: { paragraphs },
  };
}

/**
 * @param {{ paragraphs: string[] }} narrative
 * @returns {string}
 */
export function narrativeText(narrative) {
  if (!narrative?.paragraphs) return '';
  return narrative.paragraphs.join(' ');
}

/**
 * @param {object} narrative
 * @param {Set<number>} allowedNumbers
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateNumbersInNarrative(narrative, allowedNumbers) {
  const text = narrativeText(narrative);
  const mentioned = extractNumbersFromText(text);
  for (const num of mentioned) {
    if (!numberAllowed(num, allowedNumbers)) {
      return { ok: false, error: `invented_number:${num}` };
    }
  }
  return { ok: true };
}

/**
 * @param {...string} parts
 */
function countWords(...parts) {
  return parts
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * @param {string} text
 * @returns {number[]}
 */
export function extractNumbersFromText(text) {
  const normalized = text
    .replace(/\d{1,3}(?:\s\d{3})+(?!\d)/g, (m) => m.replace(/\s/g, ''))
    .replace(/\d{1,3}(?:,\d{3})+(?!\d)/g, (m) => m.replace(/,/g, ''));
  const matches = normalized.match(/\d+(?:[.,]\d+)?/g) || [];
  return matches.map((m) => parseFloat(m.replace(',', '.')));
}

/**
 * @param {unknown} value
 * @param {Set<number>} out
 */
function collectNumbers(value, out) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    out.add(value);
    out.add(Math.abs(value));
    if (value > 0 && value <= 1) {
      out.add(Math.round(value * 100));
    }
    if (value > 1 && value < 10) {
      out.add(Math.round(value * 100));
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectNumbers(v, out));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => collectNumbers(v, out));
  }
}

/**
 * @param {object} fixture
 * @returns {Set<number>}
 */
export function allowedNumbersFromFixture(fixture) {
  const out = new Set();
  collectNumbers(fixture, out);

  const ledger = fixture.snapshot?.ledger;
  if (ledger && typeof ledger === 'object') {
    const { fixed_m: fixed, debt_m: debt, flex_m: flex, income_m: income, surplus_m: surplus } = ledger;
    if (typeof fixed === 'number' && typeof debt === 'number') {
      out.add(fixed + debt);
    }
    if (typeof fixed === 'number' && typeof debt === 'number' && typeof flex === 'number') {
      out.add(fixed + debt + flex);
    }
    if (typeof income === 'number' && typeof surplus === 'number') {
      out.add(income - surplus);
      out.add(Math.abs(income - surplus));
    }
  }

  for (const rule of fixture.triggered_rules || []) {
    if (rule.detail) collectNumbers(rule.detail, out);
    if (rule.facts) collectNumbers(rule.facts, out);
  }

  return out;
}

/**
 * @param {number} num
 * @param {Set<number>} allowed
 */
function numberAllowed(num, allowed) {
  for (const a of allowed) {
    if (Math.abs(a - num) < 0.51) return true;
    if (a >= 1000 && Math.abs(a - num) < 2) return true;
  }
  return false;
}
