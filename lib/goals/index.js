import { setData } from '../storage';
import { processGoalFundingIfDue } from './goalFunding';
import { migrateGoalsIfNeeded } from './goalsMigration';
import {
  syncGoalsWithSources,
  finalizeGoalStates,
} from './goalSync';
import { loadGoals, saveGoals } from './goalStorage';
import { scanGoalAlerts, scanGoalFundingAlerts } from './goalAlerts';

/**
 * Full goals pipeline for dashboard bundle load.
 * @param {{
 *   income: import('../schema').Income|null|undefined,
 *   debts: import('../schema').DebtEntry[],
 *   budget: import('../schema').Budget,
 *   t: (key: string, params?: object) => string,
 * }} input
 * @returns {Promise<{
 *   goals: import('../schema').Goal[],
 *   budget: import('../schema').Budget,
 *   income: import('../schema').Income|null|undefined,
 *   debts: import('../schema').DebtEntry[],
 *   pendingCelebrations: string[],
 *   goalAlertRecords: import('../alerts').AlertRecord[],
 *   persisted: boolean,
 * }>}
 */
export async function processGoalsPipeline({
  income,
  debts,
  budget,
  t,
}) {
  let goals = await loadGoals();
  let nextBudget = { ...budget };
  let nextIncome = income && typeof income === 'object' ? { ...income } : income;
  let nextDebts = [...(debts || [])];
  let persisted = false;

  const migration = await migrateGoalsIfNeeded(goals, nextIncome, nextDebts, t);
  goals = migration.goals;
  if (migration.migrated) persisted = true;

  goals = syncGoalsWithSources(goals, nextDebts, nextIncome, t);

  const funding = processGoalFundingIfDue(goals, nextBudget, nextIncome, nextDebts);
  goals = funding.goals;
  nextBudget = funding.budget;
  nextIncome = funding.income;
  nextDebts = funding.debts;
  if (funding.fundingAlerts.length > 0) persisted = true;

  const finalized = finalizeGoalStates(goals, nextDebts);
  goals = finalized.goals;
  nextDebts = finalized.debts;
  const pendingCelebrations = finalized.pendingCelebrations;
  if (pendingCelebrations.length > 0) persisted = true;

  const goalAlertRecords = [
    ...scanGoalAlerts(goals, t),
    ...scanGoalFundingAlerts(funding.fundingAlerts, goals, t),
  ];

  await saveGoals(goals);
  if (JSON.stringify(nextDebts) !== JSON.stringify(debts || [])) {
    await setData('beaverr_debts', nextDebts);
  }
  if (JSON.stringify(nextBudget) !== JSON.stringify(budget)) {
    await setData('beaverr_budget', nextBudget);
  }
  if (JSON.stringify(nextIncome) !== JSON.stringify(income)) {
    await setData('beaverr_income', nextIncome);
  }

  return {
    goals,
    budget: nextBudget,
    income: nextIncome,
    debts: nextDebts,
    pendingCelebrations,
    goalAlertRecords,
    persisted: true,
  };
}

export { loadGoals, saveGoals } from './goalStorage';
export {
  archiveGoal,
  pauseGoalsUsingStash,
  updateGoal,
  findEmergencyGoal,
  getGoalForDebt,
  isDebtReadOnly,
  buildDebtGoalFromEntry,
} from './goalSync';
export { recalculateDebtGoalFromBalance, computeProgressPercent, isGoalComplete } from './goalProgress';
export { createGoalId, createFundingRuleId } from './goalIds';
