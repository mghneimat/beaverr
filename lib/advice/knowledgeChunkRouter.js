/**
 * Rule → knowledge chunk routing (static v1).
 * Index: docs/advice-knowledge-index.md
 */

import { getKnowledgeChunksByIds } from './knowledgeChunks.js';

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 };

/** @type {Record<string, string[]>} */
const RULE_TO_CHUNKS = {
  fixed_cost_ratio_tight: ['sethi_csp#fixed_costs_crisis', 'cfpb#fragility'],
  overcommitted: ['sethi_csp#fixed_costs_crisis', 'cfpb#dti_thresholds'],
  negative_surplus: ['cfpb#fragility', 'tightwad#cost_per_use'],
  high_apr: ['sethi_csp#debt_priority', 'cfpb#dti_thresholds'],
  housing_cost_share_elevated: ['cfpb#dti_thresholds', 'sethi_csp#fixed_costs_crisis'],
  debt_payment_ratio_high: ['cfpb#dti_thresholds', 'sethi_csp#debt_priority'],
  savings_buffer_low: ['cfpb#emergency_fund', 'cfpb#fragility'],
  single_income_household: ['cfpb#emergency_fund', 'sethi_csp#positive_signals'],
  income_concentration: ['sethi_csp#fixed_costs_crisis', 'mnd#lifestyle_inflation'],
  household_overview: ['sethi_csp#positive_signals', 'cfpb#emergency_fund'],
  income_empty: ['sethi_csp#fixed_costs_crisis', 'cfpb#fragility'],
  income_sources_recorded: ['sethi_csp#positive_signals', 'mnd#lifestyle_inflation'],
  health_coverage_gap: ['cfpb#fragility'],
  vehicle_tpl_exposure: ['cfpb#fragility'],
};

/** @type {Partial<Record<string, string[]>>} */
const TAB_CHUNK_PREFERENCE = {
  expenses: ['tightwad#cost_per_use', 'ymyl#gazingus_pins'],
  budget: ['sethi_csp#fixed_costs_crisis', 'cfpb#dti_thresholds'],
  savings: ['cfpb#emergency_fund', 'sethi_csp#positive_signals'],
  goals: ['cfpb#emergency_fund', 'ymyl#fulfillment_curve'],
  income: ['mnd#lifestyle_inflation', 'sethi_csp#positive_signals'],
  tracker: ['ymyl#gazingus_pins', 'tightwad#cost_per_use'],
};

const MAX_CHUNKS = 2;

/**
 * @param {object[]} triggeredRules
 * @param {string} [tabKey]
 * @returns {{ id: string, excerpt: string }[]}
 */
export function selectKnowledgeChunks(triggeredRules, tabKey = 'home') {
  const rules = Array.isArray(triggeredRules) ? triggeredRules : [];
  const sorted = [...rules].sort((a, b) => {
    const sa = SEVERITY_RANK[a.severity] ?? 3;
    const sb = SEVERITY_RANK[b.severity] ?? 3;
    return sa - sb;
  });

  const candidateIds = [];

  for (const rule of sorted) {
    const mapped = RULE_TO_CHUNKS[rule.id];
    if (mapped) candidateIds.push(...mapped);
  }

  const tabPrefs = TAB_CHUNK_PREFERENCE[tabKey];
  if (tabPrefs) candidateIds.unshift(...tabPrefs);

  const uniqueIds = [];
  for (const id of candidateIds) {
    if (!uniqueIds.includes(id)) uniqueIds.push(id);
    if (uniqueIds.length >= MAX_CHUNKS) break;
  }

  return getKnowledgeChunksByIds(uniqueIds).map(({ id, excerpt }) => ({ id, excerpt }));
}

/**
 * @param {object[]} triggeredRules
 * @param {string} [tabKey]
 * @returns {string[]}
 */
export function selectKnowledgeChunkIds(triggeredRules, tabKey) {
  return selectKnowledgeChunks(triggeredRules, tabKey).map((c) => c.id);
}
