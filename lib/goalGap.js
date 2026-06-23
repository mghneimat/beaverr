import { parseStoredDate } from './datePicker';
import { hasTargetSavingsGoal } from './incomeGoals';

/**
 * @param {string} dateStr - DD/MM/YYYY or MM/YYYY
 * @returns {Date|null}
 */
function parseGoalDate(dateStr) {
  if (!dateStr) return null;
  const { day, month, year } = parseStoredDate(dateStr, dateStr.split('/').length === 3);
  if (!month || !year) return null;
  return new Date(year, month - 1, day || 1);
}

import { findEmergencyGoal } from './goals/goalSync';
import { monthsUntilEndDate } from './goals/goalPace';

/**
 * @param {import('./householdBudget').HouseholdFinancials} financials
 * @param {import('./schema').Goal[]} [goals]
 * @returns {{ monthlyRequired: number, monthsRemaining: number, achievable: boolean, gap: number }|null}
 */
export function computeGoalGap(financials, goals = []) {
  const emergency = findEmergencyGoal(goals);
  if (emergency && emergency.lifecycleStatus === 'active') {
    const target = Number(emergency.targetAmount) || 0;
    const balance = Number(emergency.currentAmount) || 0;
    const remaining = Math.max(0, target - balance);
    const goalDate = parseGoalDate(emergency.endDate);
    if (!goalDate || remaining <= 0) {
      return { monthlyRequired: 0, monthsRemaining: 0, achievable: true, gap: 0 };
    }
    const monthsRemaining = monthsUntilEndDate(emergency.endDate) || 1;
    const monthlyRequired = remaining / monthsRemaining;
    const surplus = financials.monthlyFlexible;
    const achievable = monthlyRequired <= surplus;
    const gap = Math.max(0, monthlyRequired - surplus);
    return { monthlyRequired, monthsRemaining, achievable, gap };
  }

  const inc = financials.income;
  if (!hasTargetSavingsGoal(inc)) return null;

  const target = Number(inc.goalAmount);
  const balance = Number(inc.savingsBalance || 0);
  const remaining = Math.max(0, target - balance);
  const goalDate = parseGoalDate(inc.goalDate);
  if (!goalDate || remaining <= 0) {
    return { monthlyRequired: 0, monthsRemaining: 0, achievable: true, gap: 0 };
  }

  const now = new Date();
  const monthsRemaining = Math.max(
    1,
    (goalDate.getFullYear() - now.getFullYear()) * 12 + (goalDate.getMonth() - now.getMonth()),
  );
  const monthlyRequired = remaining / monthsRemaining;
  const surplus = financials.monthlyFlexible;
  const achievable = monthlyRequired <= surplus;
  const gap = Math.max(0, monthlyRequired - surplus);

  return { monthlyRequired, monthsRemaining, achievable, gap };
}
