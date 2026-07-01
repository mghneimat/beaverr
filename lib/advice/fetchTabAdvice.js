import { buildTabSnapshot } from './buildTabSnapshot.js';
import { evaluateTabAdviceRules } from './evaluateTabAdviceRules.js';
import { getLinkedHouseholdId } from '../cloud/syncHousehold.js';
import { requestAdviceNarrative } from './requestAdvice.js';

export { narrativeToParagraphs } from './narrativeToParagraphs.js';

/**
 * @param {{
 *   tabKey: import('./buildTabSnapshot.js').TabAdviceKey,
 *   financials: import('../householdBudget').HouseholdFinancials,
 *   locale: string,
 *   helpers?: object,
 * }} input
 */
export async function fetchTabAdvice({ tabKey, financials, locale, helpers = {} }) {
  const { snapshot, ruleContext } = buildTabSnapshot(tabKey, {
    financials,
    locale,
    helpers,
  });
  const triggered_rules = evaluateTabAdviceRules(tabKey, snapshot, ruleContext);

  if (triggered_rules.length === 0) {
    return {
      ok: true,
      status: 'skipped',
      reason: 'no_rules',
      triggered_rules,
      snapshot,
    };
  }

  const household_id = await getLinkedHouseholdId();
  const result = await requestAdviceNarrative({
    snapshot,
    triggered_rules,
    locale,
    tab_key: tabKey,
    household_id: household_id ?? undefined,
  });

  return { ...result, triggered_rules, snapshot };
}
