import { buildFinancialSnapshot } from './buildFinancialSnapshot.js';
import { evaluateAdviceRules } from './evaluateAdviceRules.js';
import { getLinkedHouseholdId } from '../cloud/syncHousehold.js';
import { requestAdviceNarrative } from './requestAdvice.js';

/**
 * Build snapshot + rules from dashboard financials and request LLM narration when rules fire.
 * @param {{
 *   financials: import('../householdBudget').HouseholdFinancials,
 *   locale: string,
 * }} input
 */
export async function fetchHouseholdAdvice({ financials, locale }) {
  const snapshot = buildFinancialSnapshot({ financials, locale });
  const triggered_rules = evaluateAdviceRules(snapshot, {
    debts: financials.debts,
    byCategory: financials.byCategory,
    financialRisks: financials.financialRisks,
    sections: financials.sections,
  });

  if (triggered_rules.length === 0) {
    return { ok: true, status: 'skipped', reason: 'no_rules', triggered_rules, snapshot };
  }

  const household_id = await getLinkedHouseholdId();

  const result = await requestAdviceNarrative({
    snapshot,
    triggered_rules,
    locale,
    household_id: household_id ?? undefined,
  });

  return { ...result, triggered_rules, snapshot };
}

/**
 * @param {object} narrative
 * @returns {string[]}
 */
export function narrativeToParagraphs(narrative) {
  if (!narrative) return [];
  const bullets = Array.isArray(narrative.bullets) ? narrative.bullets.filter(Boolean) : [];
  if (typeof narrative.headline === 'string' && narrative.headline.trim()) {
    return [narrative.headline.trim(), ...bullets];
  }
  return bullets;
}
