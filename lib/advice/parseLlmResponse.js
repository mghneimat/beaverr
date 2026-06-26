import {
  ADVICE_FOCUS_AREAS,
  ADVICE_MAX_BULLETS,
  ADVICE_MAX_WORDS,
  ADVICE_OUTPUT_SCHEMA_KEYS,
  KNOWN_RULE_IDS,
} from './constants.js';

/**
 * @param {unknown} raw
 * @returns {{ ok: true, narrative: object } | { ok: false, error: string }}
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

  if (typeof parsed.headline !== 'string' || !parsed.headline.trim()) {
    return { ok: false, error: 'invalid_headline' };
  }

  if (!Array.isArray(parsed.bullets) || parsed.bullets.length === 0) {
    return { ok: false, error: 'invalid_bullets' };
  }

  if (parsed.bullets.length > ADVICE_MAX_BULLETS) {
    return { ok: false, error: 'too_many_bullets' };
  }

  if (!parsed.bullets.every((b) => typeof b === 'string' && b.trim())) {
    return { ok: false, error: 'invalid_bullet_item' };
  }

  if (!ADVICE_FOCUS_AREAS.includes(parsed.focus_area)) {
    return { ok: false, error: 'invalid_focus_area' };
  }

  if (!Array.isArray(parsed.citations_used)) {
    return { ok: false, error: 'invalid_citations_used' };
  }

  const wordCount = countWords(parsed.headline, ...parsed.bullets);
  if (wordCount > ADVICE_MAX_WORDS) {
    return { ok: false, error: 'word_count_exceeded' };
  }

  return {
    ok: true,
    narrative: {
      headline: parsed.headline.trim(),
      bullets: parsed.bullets.map((b) => b.trim()),
      focus_area: parsed.focus_area,
      citations_used: parsed.citations_used,
    },
  };
}

/**
 * @param {object} narrative
 * @param {string[]} sentKbChunkIds
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateCitationsUsed(narrative, sentKbChunkIds = []) {
  const sent = new Set(sentKbChunkIds);
  const ruleIds = new Set(KNOWN_RULE_IDS);

  if (sent.size === 0 && narrative.citations_used.length > 0) {
    return { ok: false, error: 'citations_must_be_empty_without_kb' };
  }

  for (const id of narrative.citations_used) {
    if (ruleIds.has(id)) {
      return { ok: false, error: `rule_id_in_citations:${id}` };
    }
    if (!sent.has(id)) {
      return { ok: false, error: `citation_not_sent:${id}` };
    }
  }

  return { ok: true };
}

/**
 * @param {object} narrative
 * @param {Set<number>} allowedNumbers
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateNumbersInNarrative(narrative, allowedNumbers) {
  const text = [narrative.headline, ...narrative.bullets].join(' ');
  const mentioned = extractNumbersFromText(text);
  for (const num of mentioned) {
    if (!numberAllowed(num, allowedNumbers)) {
      return { ok: false, error: `invented_number:${num}` };
    }
  }
  return { ok: true };
}

/** @deprecated Use validateCitationsUsed + validateNumbersInNarrative */
export function validateNarrativeFidelity(narrative, sentKbChunkIds, allowedNumbers) {
  const citations = validateCitationsUsed(narrative, sentKbChunkIds);
  if (!citations.ok) return citations;
  return validateNumbersInNarrative(narrative, allowedNumbers);
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
