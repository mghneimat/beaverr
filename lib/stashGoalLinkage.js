import { toMonthly, roundMoney } from './finance';
import { formatFundingRuleSummary } from './goals/goalFundingDisplay';

/**
 * Jar grid line id matches stash ref (looseCash, savings, stash:{id}).
 * @param {string} jarLineId
 * @returns {string}
 */
export function jarLineIdToStashRef(jarLineId) {
  return jarLineId || '';
}

/**
 * @param {import('./schema').Goal[]} goals
 * @param {string} stashRef
 * @returns {import('./schema').Goal[]}
 */
export function getGoalsLinkedToStash(goals, stashRef) {
  return (goals || []).filter((goal) => {
    if (goal.lifecycleStatus === 'archived') return false;
    return (goal.fundingRules || []).some(
      (rule) => rule.stashRef === stashRef && (Number(rule.amount) || 0) > 0,
    );
  });
}

/**
 * @param {import('./schema').Goal} goal
 * @param {string} stashRef
 * @returns {import('./schema').GoalFundingRule[]}
 */
export function getFundingRulesForStash(goal, stashRef) {
  return (goal.fundingRules || []).filter(
    (rule) => rule.stashRef === stashRef && (Number(rule.amount) || 0) > 0,
  );
}

/**
 * Sum monthly equivalent of all active funding rules from a stash.
 * @param {import('./schema').Goal[]} goals
 * @param {string} stashRef
 * @returns {number}
 */
export function sumPlannedMonthlyOutflowFromStash(goals, stashRef) {
  return getGoalsLinkedToStash(goals, stashRef).reduce((sum, goal) => {
    if (goal.lifecycleStatus !== 'active') return sum;
    const rules = getFundingRulesForStash(goal, stashRef);
    return sum + rules.reduce((ruleSum, rule) => {
      if (rule.frequency === 'once') return ruleSum;
      return ruleSum + toMonthly(Number(rule.amount) || 0, rule.frequency);
    }, 0);
  }, 0);
}

/**
 * Sum of goal funding already moved out of a stash (one-time and recurring).
 * @param {import('./schema').StashMovement[]} movements
 * @param {string} stashRef
 * @returns {number}
 */
export function sumCommittedGoalFundingFromStash(movements, stashRef) {
  return roundMoney(
    (movements || [])
      .filter((row) => (
        row.stashRef === stashRef
        && row.direction === 'out'
        && row.type === 'goal_funding'
      ))
      .reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
  );
}

/**
 * Sum of upcoming per-transfer amounts pledged from a stash to linked goals.
 * @param {import('./schema').Goal[]} goals
 * @param {string} stashRef
 * @returns {number}
 */
export function sumUpcomingReservedFromStash(goals, stashRef) {
  return roundMoney(
    getGoalsLinkedToStash(goals, stashRef).reduce((sum, goal) => {
      if (goal.lifecycleStatus !== 'active') return sum;
      return sum + getFundingRulesForStash(goal, stashRef).reduce((ruleSum, rule) => {
        if (rule.frequency === 'once' && rule.lastProcessedAt) return ruleSum;
        return ruleSum + (Number(rule.amount) || 0);
      }, 0);
    }, 0),
  );
}

/**
 * @typedef {Object} StashBalanceBreakdown
 * @property {number} total - Tab total (in-tab balance + goal outflows)
 * @property {number} reserved - Committed to linked goals (moved + upcoming rules)
 * @property {number} available - In-tab balance free of upcoming rule commitments
 * @property {number} inTab - Current physical balance in the tab
 */

/**
 * @param {number} balance
 * @param {import('./schema').Goal[]} goals
 * @param {string} stashRef
 * @param {import('./schema').StashMovement[]} [movements]
 * @returns {StashBalanceBreakdown}
 */
export function computeStashBalanceBreakdown(balance, goals, stashRef, movements = []) {
  const inTab = roundMoney(Number(balance) || 0);
  const committedOutflows = sumCommittedGoalFundingFromStash(movements, stashRef);
  const pendingRules = sumUpcomingReservedFromStash(goals, stashRef);
  const total = roundMoney(inTab + committedOutflows);
  const reserved = roundMoney(committedOutflows + pendingRules);
  const available = roundMoney(Math.max(0, inTab - pendingRules));
  return { total, reserved, available, inTab };
}

/**
 * @typedef {Object} LinkedGoalRow
 * @property {import('./schema').Goal} goal
 * @property {import('./schema').GoalFundingRule[]} rules
 * @property {string[]} summaries
 */

/**
 * @param {import('./schema').Goal[]} goals
 * @param {string} stashRef
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {(key: string, params?: object) => string} t
 * @param {string} currency
 * @returns {LinkedGoalRow[]}
 */
export function buildLinkedGoalRows(goals, stashRef, budget, t, currency) {
  return getGoalsLinkedToStash(goals, stashRef).map((goal) => {
    const rules = getFundingRulesForStash(goal, stashRef);
    return {
      goal,
      rules,
      summaries: rules.map((rule) => formatFundingRuleSummary(rule, budget, t, currency)),
    };
  });
}

/**
 * @typedef {Object} GoalFundingSourceRow
 * @property {import('./schema').Goal} goal
 * @property {string} stashRef
 * @property {import('./schema').GoalFundingRule[]} rules
 * @property {string[]} summaries
 */

/**
 * @param {import('./schema').Goal} goal
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {(key: string, params?: object) => string} t
 * @param {string} currency
 * @returns {GoalFundingSourceRow[]}
 */
export function buildGoalFundingSourceRows(goal, budget, t, currency) {
  const rules = (goal.fundingRules || []).filter((r) => (Number(r.amount) || 0) > 0);
  if (rules.length === 0) return [];

  const byStash = new Map();
  rules.forEach((rule) => {
    const key = rule.stashRef;
    if (!byStash.has(key)) byStash.set(key, []);
    byStash.get(key).push(rule);
  });

  return [...byStash.entries()].map(([stashRef, stashRules]) => ({
    goal,
    stashRef,
    rules: stashRules,
    summaries: stashRules.map((rule) => formatFundingRuleSummary(rule, budget, t, currency)),
  }));
}

/**
 * @typedef {Object} StashGoalLinkItem
 * @property {import('./schema').Goal} goal
 * @property {import('./schema').GoalFundingRule} rule
 */

/**
 * Flat list of active funding links from a stash tab to goals.
 * @param {import('./schema').Goal[]} goals
 * @param {string} stashRef
 * @returns {StashGoalLinkItem[]}
 */
export function buildStashGoalLinkItems(goals, stashRef) {
  /** @type {StashGoalLinkItem[]} */
  const items = [];
  getGoalsLinkedToStash(goals, stashRef).forEach((goal) => {
    getFundingRulesForStash(goal, stashRef).forEach((rule) => {
      items.push({ goal, rule });
    });
  });
  return items;
}
