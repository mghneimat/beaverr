import { formatCurrency } from '../finance';
import { getCustomStashes } from '../customStashes';
import { isoDateToStoredDate } from './goalFundingSchedule';

/**
 * @param {string} stashRef
 * @param {import('../schema').Budget|null|undefined} budget
 * @param {(key: string, params?: object) => string} t
 * @returns {string}
 */
export function resolveStashRefLabel(stashRef, budget, t) {
  if (stashRef === 'looseCash') return t('dashboard.home.jars.looseCash.title');
  if (stashRef === 'savings') return t('dashboard.home.jars.savings.title');
  if (stashRef?.startsWith('stash:')) {
    const stashId = stashRef.slice('stash:'.length);
    const stash = getCustomStashes(budget).find((row) => row.id === stashId);
    return stash?.name || stashRef;
  }
  return stashRef || '';
}

/**
 * @param {import('../schema').GoalFundingRule} rule
 * @param {import('../schema').Budget|null|undefined} budget
 * @param {(key: string, params?: object) => string} t
 * @param {string} currency
 * @returns {string}
 */
export function formatFundingRuleSummary(rule, budget, t, currency) {
  const tab = resolveStashRefLabel(rule.stashRef, budget, t);
  const amount = formatCurrency(Number(rule.amount) || 0, currency);
  const startDate = rule.nextRunDate
    ? isoDateToStoredDate(rule.nextRunDate)
    : '';
  if (rule.frequency === 'once') {
    if (startDate) {
      return t('dashboard.goalsScreen.funding.ruleSummaryOnceDate', { amount, tab, date: startDate });
    }
    return t('dashboard.goalsScreen.funding.ruleSummaryOnce', { amount, tab });
  }
  const frequency = t(`dashboard.goalsScreen.funding.frequency.${rule.frequency}`);
  if (startDate) {
    return t('dashboard.goalsScreen.funding.ruleSummaryWithDate', {
      amount,
      frequency,
      tab,
      date: startDate,
    });
  }
  return t('dashboard.goalsScreen.funding.ruleSummary', { amount, frequency, tab });
}

/**
 * @param {import('../schema').GoalFundingRule} rule
 * @param {(key: string, params?: object) => string} t
 * @param {string} currency
 * @returns {string}
 */
export function formatFundingRuleAmountLine(rule, t, currency) {
  const amount = formatCurrency(Number(rule.amount) || 0, currency);
  if (rule.frequency === 'once') {
    return t('dashboard.goalsScreen.funding.linkAmountOnce', { amount });
  }
  const frequency = t(`dashboard.goalsScreen.funding.frequency.${rule.frequency}`);
  return t('dashboard.goalsScreen.funding.linkAmountFrequency', { amount, frequency });
}

/**
 * @param {import('../schema').GoalFundingRule} rule
 * @param {string} currency
 * @returns {string}
 */
export function formatFundingRuleAmount(rule, currency) {
  return formatCurrency(Number(rule.amount) || 0, currency);
}

/**
 * @param {import('../schema').GoalFundingRule} rule
 * @param {(key: string, params?: object) => string} t
 * @returns {string}
 */
export function formatFundingRuleFrequencyLabel(rule, t) {
  if (rule.frequency === 'once') {
    return t('dashboard.goalsScreen.funding.frequency.once');
  }
  return t(`dashboard.goalsScreen.funding.frequency.${rule.frequency}`);
}

/**
 * @param {import('../schema').GoalFundingRule} rule
 * @param {(key: string, params?: object) => string} t
 * @returns {string|null}
 */
export function formatFundingRuleNextMoveLine(rule, t) {
  if (!rule.nextRunDate) return null;
  return t('dashboard.goalsScreen.funding.linkNextMove', {
    date: isoDateToStoredDate(rule.nextRunDate),
  });
}

/**
 * @param {import('../schema').Goal} goal
 * @param {import('../schema').Budget|null|undefined} budget
 * @param {(key: string, params?: object) => string} t
 * @param {string} currency
 * @returns {string}
 */
export function getGoalFundingFooter(goal, budget, t, currency) {
  const rules = (goal.fundingRules || []).filter((rule) => (Number(rule.amount) || 0) > 0);
  if (rules.length === 0) return '';
  if (rules.length === 1) {
    return formatFundingRuleSummary(rules[0], budget, t, currency);
  }
  return t('dashboard.goalsScreen.funding.multipleRules', { count: rules.length });
}