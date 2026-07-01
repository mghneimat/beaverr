/**
 * Country-specific official chunk routing (static v1).
 * Index: docs/advice-knowledge-index.md (country section)
 */

import {
  getCountryKnowledgeChunksByIds,
  toKbChunkPayload,
} from './countryKnowledgeChunks.js';

const MAX_COUNTRY_CHUNKS = 2;

/** @type {Record<string, string[]>} */
const RULE_TO_COUNTRY_CHUNKS = {
  health_coverage_gap: ['cz_official#health_insurance'],
  housing_cost_share_elevated: ['cz_official#renting'],
  vehicle_tpl_exposure: ['cz_official#transport'],
};

/** @type {Partial<Record<string, string[]>>} */
const TAB_COUNTRY_PREFERENCE = {
  expenses: ['cz_official#renting', 'cz_official#utilities', 'cz_official#transport'],
  budget: ['cz_official#taxes', 'cz_official#utilities'],
  alerts: ['cz_official#health_insurance', 'cz_official#permits'],
  home: ['cz_official#permits', 'cz_official#health_insurance'],
};

/** @type {Record<string, string[]>} */
const MESSAGE_TOPIC_KEYWORDS = {
  'cz_official#permits': ['permit', 'visa', 'residence', 'moi', 'pobyt', 'povolen', 'cizinc'],
  'cz_official#renting': ['rent', 'tenant', 'landlord', 'lease', 'nájem', 'pronájem', 'nájemn'],
  'cz_official#health_insurance': [
    'health',
    'insurance',
    'vzp',
    'pojist',
    'zdravot',
    'pojištění',
  ],
  'cz_official#taxes': ['tax', 'daně', 'daň', 'finanční', 'financni', 'příjem', 'prijem'],
  'cz_official#utilities': ['utility', 'utilities', 'energy', 'waste', 'popeln', 'energie', 'vodné'],
  'cz_official#transport': [
    'transport',
    'vignette',
    'dalnice',
    'parking',
    'vehicle',
    'auto',
    'stk',
    'ručení',
  ],
};

/**
 * @param {string} message
 * @returns {string[]}
 */
function matchMessageToChunkIds(message) {
  if (!message || typeof message !== 'string') return [];
  const lower = message.toLowerCase();
  const matched = [];
  for (const [chunkId, keywords] of Object.entries(MESSAGE_TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(chunkId);
    }
  }
  return matched;
}

/**
 * @param {{
 *   country_code?: string,
 *   tabKey?: string,
 *   triggered_rules?: object[],
 *   userMessage?: string,
 * }} input
 * @returns {ReturnType<typeof toKbChunkPayload>[]}
 */
export function selectCountryKnowledgeChunks({
  country_code = 'CZ',
  tabKey = 'home',
  triggered_rules = [],
  userMessage,
} = {}) {
  const code = (country_code || 'CZ').toUpperCase();
  if (code !== 'CZ') {
    return [];
  }

  const candidateIds = [];

  if (userMessage) {
    candidateIds.push(...matchMessageToChunkIds(userMessage));
  }

  const rules = Array.isArray(triggered_rules) ? triggered_rules : [];
  for (const rule of rules) {
    const mapped = RULE_TO_COUNTRY_CHUNKS[rule.id];
    if (mapped) candidateIds.push(...mapped);
  }

  const tabPrefs = TAB_COUNTRY_PREFERENCE[tabKey];
  if (tabPrefs) candidateIds.unshift(...tabPrefs);

  const uniqueIds = [];
  for (const id of candidateIds) {
    if (!uniqueIds.includes(id)) uniqueIds.push(id);
    if (uniqueIds.length >= MAX_COUNTRY_CHUNKS) break;
  }

  return getCountryKnowledgeChunksByIds(uniqueIds, code).map(toKbChunkPayload);
}

/**
 * @param {object} snapshot
 * @returns {string}
 */
export function countryCodeFromSnapshot(snapshot) {
  return snapshot?.location?.country_code || 'CZ';
}
