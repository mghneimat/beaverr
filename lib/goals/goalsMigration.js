import {
  GOAL_TYPES,
  hasTargetSavingsGoal,
  normalizeIncomeGoalFields,
} from '../incomeGoals';
import { buildDebtGoalFromEntry, buildEmergencyGoalFromIncome, buildReduceCostsGoal } from './goalSync';
import { resolveDebtId } from './goalIds';
import { isGoalsMigrated, markGoalsMigrated } from './goalStorage';

/**
 * One-time migration from legacy income/debts to goals portfolio.
 * @param {import('../schema').Goal[]} goals
 * @param {object|null|undefined} income
 * @param {import('../schema').DebtEntry[]} debts
 * @param {(key: string, params?: object) => string} t
 * @returns {{ goals: import('../schema').Goal[], changed: boolean }}
 */
export function migrateGoalsFromLegacy(goals, income, debts, t) {
  /** @type {import('../schema').Goal[]} */
  let next = [...goals];
  let changed = false;

  if (hasTargetSavingsGoal(income) && !next.some((g) => g.type === 'savings' && g.autoCreated)) {
    next.push(buildEmergencyGoalFromIncome(income, t));
    changed = true;
  }

  const { goalType } = normalizeIncomeGoalFields(income);
  if (
    (goalType === GOAL_TYPES.REDUCE_COSTS || goalType === GOAL_TYPES.REDUCE_AND_SAVE)
    && !next.some((g) => g.type === 'reduceCosts')
  ) {
    next.push(buildReduceCostsGoal(t));
    changed = true;
  }

  (debts || []).forEach((debt, index) => {
    const debtId = resolveDebtId(debt, index);
    if (!next.some((g) => g.type === 'debt' && g.linkedDebtId === debtId)) {
      next.push(buildDebtGoalFromEntry({ ...debt, id: debtId }, index, t));
      changed = true;
    }
  });

  return { goals: next, changed };
}

/**
 * @param {import('../schema').Goal[]} goals
 * @param {object|null|undefined} income
 * @param {import('../schema').DebtEntry[]} debts
 * @param {(key: string, params?: object) => string} t
 * @returns {Promise<{ goals: import('../schema').Goal[], migrated: boolean }>}
 */
export async function migrateGoalsIfNeeded(goals, income, debts, t) {
  const already = await isGoalsMigrated();
  if (already) {
    return { goals, migrated: false };
  }

  const { goals: migratedGoals, changed } = migrateGoalsFromLegacy(goals, income, debts, t);
  if (changed || migratedGoals.length > 0) {
    await markGoalsMigrated();
    return { goals: migratedGoals, migrated: true };
  }

  await markGoalsMigrated();
  return { goals, migrated: false };
}
