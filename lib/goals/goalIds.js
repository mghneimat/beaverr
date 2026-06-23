/**
 * @returns {string}
 */
export function createGoalId() {
  return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @returns {string}
 */
export function createFundingRuleId() {
  return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @returns {string} YYYY-MM-DD
 */
export function todayIsoDate(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {import('../schema').DebtEntry} debt
 * @param {number} index
 * @returns {string}
 */
export function resolveDebtId(debt, index) {
  return debt?.id || `debt_${index}`;
}
