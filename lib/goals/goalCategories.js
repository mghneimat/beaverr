/** @typedef {'savings' | 'debt' | 'reduceCosts'} GoalCategory */
/** @typedef {'goals' | 'debts' | 'reduceCosts'} GoalUiSection */

export const GOAL_CATEGORY_ORDER = /** @type {const} */ (['savings', 'debt', 'reduceCosts']);
export const GOAL_UI_SECTION_ORDER = /** @type {const} */ (['goals', 'debts', 'reduceCosts']);

/**
 * @param {import('../schema').Goal} goal
 * @returns {GoalCategory}
 */
export function getGoalCategory(goal) {
  if (goal.type === 'debt') return 'debt';
  if (goal.type === 'reduceCosts') return 'reduceCosts';
  return 'savings';
}

/**
 * @param {import('../schema').Goal[]} goals
 * @returns {Record<GoalCategory, import('../schema').Goal[]>}
 */
export function groupGoalsByCategory(goals) {
  /** @type {Record<GoalCategory, import('../schema').Goal[]>} */
  const grouped = { savings: [], debt: [], reduceCosts: [] };
  for (const goal of goals || []) {
    grouped[getGoalCategory(goal)].push(goal);
  }
  return grouped;
}

/**
 * Dashboard layout — savings, debt payoff, and reduce-costs in separate sections.
 * @param {import('../schema').Goal[]} goals
 * @returns {Record<GoalUiSection, import('../schema').Goal[]>}
 */
export function groupGoalsForUiSections(goals) {
  const grouped = groupGoalsByCategory(goals);
  return {
    goals: grouped.savings,
    debts: grouped.debt,
    reduceCosts: grouped.reduceCosts,
  };
}
