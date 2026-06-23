import { roundMoney } from '../finance';
import { getData, setData } from '../storage';
import { loadGoals, saveGoals } from './goalStorage';
import { createGoalId, resolveDebtId, todayIsoDate, createFundingRuleId } from './goalIds';
import { archiveGoal, buildDebtGoalFromEntry, findDebtGoal, finalizeGoalStates, updateGoal } from './goalSync';
import { applyFundingRule } from './goalFunding';
import { applyGoalPace } from './goalPace';
import { parseStoredDate } from '../datePicker';

/**
 * @param {{
 *   name: string,
 *   description?: string|null,
 *   endDate?: string|null,
 *   targetAmount: number,
 *   fundingRules?: import('../schema').GoalFundingRule[],
 * }} fields
 * @returns {import('../schema').Goal}
 */
export function buildCustomGoal(fields) {
  return {
    id: createGoalId(),
    type: 'custom',
    name: fields.name.trim(),
    description: fields.description?.trim() || null,
    endDate: fields.endDate || null,
    targetAmount: Number(fields.targetAmount) || 0,
    currentAmount: 0,
    startingPrincipal: null,
    linkedDebtId: null,
    lifecycleStatus: 'active',
    paceStatus: 'on_track',
    fundingRules: fields.fundingRules || [],
    autoCreated: false,
    completionCount: 0,
    completedAt: null,
    archivedAt: null,
    createdAt: todayIsoDate(),
    previousDebtBalance: null,
  };
}

/**
 * @param {import('../schema').Goal} goal
 * @returns {Promise<import('../schema').Goal[]>}
 */
export async function appendGoal(goal) {
  const goals = await loadGoals();
  const next = [...goals, goal];
  await saveGoals(next);
  return next;
}

/**
 * Debts from the plan that do not already have a linked payoff goal.
 * @param {import('../schema').DebtEntry[]} debts
 * @param {import('../schema').Goal[]} goals
 */
export function listDebtsAvailableForGoalCreation(debts, goals) {
  return (debts || [])
    .map((debt, index) => ({
      debt,
      index,
      debtId: resolveDebtId(debt, index),
    }))
    .filter(({ debt, debtId }) => !debt.readOnly && !findDebtGoal(goals, debtId));
}

/**
 * @param {import('../schema').DebtEntry} debt
 * @param {number} index
 * @param {(key: string, params?: object) => string} t
 * @returns {import('../schema').Goal}
 */
export function buildManualDebtGoal(debt, index, t) {
  const debtId = resolveDebtId(debt, index);
  return {
    ...buildDebtGoalFromEntry({ ...debt, id: debtId }, index, t),
    autoCreated: false,
  };
}

/**
 * @param {{
 *   creditor: string,
 *   balance: number,
 *   minPayment?: number,
 *   type?: import('../schema').DebtType,
 * }} fields
 * @returns {import('../schema').DebtEntry}
 */
export function createDebtEntry(fields) {
  return {
    id: `debt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: fields.type || 'other',
    creditor: fields.creditor?.trim() || null,
    balance: Number(fields.balance) || 0,
    minPayment: Number(fields.minPayment) || 0,
    apr: 0,
    promoEndDate: null,
    paymentDueDay: null,
    notes: null,
  };
}

/**
 * @param {import('../schema').DebtEntry} debt
 * @returns {Promise<{ debts: import('../schema').DebtEntry[], index: number }>}
 */
export async function appendDebtEntry(debt) {
  const debts = [...((await getData('beaverr_debts')) || [])];
  const next = [...debts, debt];
  await setData('beaverr_debts', next);
  return { debts: next, index: next.length - 1 };
}

/**
 * Adds a plan debt and linked manual payoff goal.
 * @param {{ creditor: string, balance: number, minPayment?: number }} fields
 * @param {(key: string, params?: object) => string} t
 */
export async function appendDebtPayoffGoal(fields, t) {
  const debt = createDebtEntry(fields);
  const { index } = await appendDebtEntry(debt);
  const goal = buildManualDebtGoal(debt, index, t);
  await appendGoal(goal);
  return goal;
}

/**
 * Moves money from a stash to a goal immediately (one-time contribution).
 * @returns {Promise<{ transferred: number, error: 'empty_source'|'insufficient'|'goal_not_found'|'goal_at_target'|null }>}
 */
export async function applyImmediateGoalContribution(
  goalId,
  { stashRef, amount },
  { budget, income, debts },
) {
  const goals = await loadGoals();
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return { transferred: 0, error: 'goal_not_found' };

  const rule = {
    id: createFundingRuleId(),
    stashRef,
    amount,
    frequency: /** @type {const} */ ('once'),
    priority: 0,
    nextRunDate: todayIsoDate(),
    lastProcessedAt: null,
  };

  const result = applyFundingRule(
    goal,
    rule,
    { ...budget },
    income,
    [...(debts || [])],
  );

  if (result.error) {
    return { transferred: 0, error: result.error };
  }
  if (result.transferred <= 0) {
    return { transferred: 0, error: 'insufficient' };
  }

  let nextGoals = goals.map((g) => (g.id === goalId ? result.goal : g));
  const finalized = finalizeGoalStates(nextGoals, result.debts);
  nextGoals = finalized.goals;

  await saveGoals(nextGoals);
  await setData('beaverr_budget', result.budget);
  await setData('beaverr_income', result.income ?? null);
  await setData('beaverr_debts', finalized.debts);

  return { transferred: result.transferred, error: null };
}

/**
 * @param {string} goalId
 * @param {Partial<import('../schema').Goal>} patch
 * @returns {Promise<import('../schema').Goal[]>}
 */
export async function patchGoal(goalId, patch) {
  const goals = await loadGoals();
  const next = goals.map((g) => (
    g.id === goalId ? updateGoal(g, patch) : g
  ));
  await saveGoals(next);
  return next;
}

/**
 * @param {import('../schema').GoalFundingRule[]} fundingRules
 * @param {string} ruleId
 * @returns {import('../schema').GoalFundingRule[]}
 */
export function buildRulesAfterRemove(fundingRules, ruleId) {
  return (fundingRules || [])
    .filter((rule) => rule.id !== ruleId)
    .map((rule, index) => ({ ...rule, priority: index }));
}

/**
 * @param {string} goalId
 * @param {string} ruleId
 * @returns {Promise<{ error: 'goal_not_found'|null }>}
 */
export async function removeGoalFundingRule(goalId, ruleId) {
  const goals = await loadGoals();
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return { error: 'goal_not_found' };
  await patchGoal(goalId, {
    fundingRules: buildRulesAfterRemove(goal.fundingRules, ruleId),
  });
  return { error: null };
}

/**
 * Sets or clears a goal deadline and recalculates pace when the goal is active.
 * @param {string} goalId
 * @param {string|null|undefined} endDate - DD/MM/YYYY, or empty to clear
 * @returns {Promise<{ error: 'goal_not_found'|'invalid_date'|null }>}
 */
export async function setGoalDeadline(goalId, endDate) {
  const trimmed = endDate?.trim() || null;

  const goals = await loadGoals();
  const index = goals.findIndex((g) => g.id === goalId);
  if (index === -1) return { error: 'goal_not_found' };

  if (!trimmed) {
    let goal = updateGoal(goals[index], { endDate: null, paceStatus: null });
    if (goal.lifecycleStatus === 'active') {
      goal = applyGoalPace(goal);
    }
    const next = [...goals];
    next[index] = goal;
    await saveGoals(next);
    return { error: null };
  }

  const { day, month, year } = parseStoredDate(trimmed, true);
  if (!day || !month || !year) {
    return { error: 'invalid_date' };
  }

  let goal = updateGoal(goals[index], { endDate: trimmed });

  if (goal.lifecycleStatus === 'active') {
    let debtBalance;
    if (goal.type === 'debt' && goal.linkedDebtId) {
      const debts = [...((await getData('beaverr_debts')) || [])];
      const debt = debts.find((d, i) => resolveDebtId(d, i) === goal.linkedDebtId);
      debtBalance = debt ? Number(debt.balance) : undefined;
    }
    goal = applyGoalPace(goal, debtBalance);
  }

  const next = [...goals];
  next[index] = goal;
  await saveGoals(next);
  return { error: null };
}

/**
 * @param {string} goalId
 * @param {{ name: string, endDate?: string|null, targetAmount: number }} fields
 * @returns {Promise<{ error: 'goal_not_found'|'not_editable'|'validation_name'|'validation_target'|null }>}
 */
export async function saveGoalEdits(goalId, { name, endDate, targetAmount }) {
  const trimmedName = name?.trim();
  if (!trimmedName) return { error: 'validation_name' };

  const target = roundMoney(Number(targetAmount) || 0);
  if (target <= 0) return { error: 'validation_target' };

  const goals = await loadGoals();
  const index = goals.findIndex((g) => g.id === goalId);
  if (index === -1) return { error: 'goal_not_found' };

  const goal = goals[index];
  if (goal.lifecycleStatus === 'archived' || goal.type === 'reduceCosts') {
    return { error: 'not_editable' };
  }

  const trimmedEndDate = endDate?.trim() || null;

  /** @type {import('../schema').Goal} */
  let nextGoal = {
    ...goal,
    name: trimmedName,
    endDate: trimmedEndDate,
    targetAmount: target,
  };

  if (goal.type === 'debt') {
    const paidDown = Number(goal.currentAmount) || 0;
    const newBalance = Math.max(0, roundMoney(target - paidDown));
    nextGoal = {
      ...nextGoal,
      startingPrincipal: target,
      previousDebtBalance: newBalance,
    };

    if (goal.linkedDebtId) {
      const debts = [...((await getData('beaverr_debts')) || [])];
      const nextDebts = debts.map((debt, debtIndex) => {
        const id = resolveDebtId(debt, debtIndex);
        if (id !== goal.linkedDebtId) return debt;
        if (debt.readOnly) {
          return { ...debt, id, creditor: trimmedName };
        }
        return {
          ...debt,
          id,
          creditor: trimmedName,
          balance: newBalance,
        };
      });
      await setData('beaverr_debts', nextDebts);
    }
  }

  if (nextGoal.lifecycleStatus === 'active') {
    let debtBalance;
    if (nextGoal.type === 'debt' && nextGoal.linkedDebtId) {
      const debts = [...((await getData('beaverr_debts')) || [])];
      const debt = debts.find((d, i) => resolveDebtId(d, i) === nextGoal.linkedDebtId);
      debtBalance = debt ? Number(debt.balance) : undefined;
    }
    nextGoal = applyGoalPace(nextGoal, debtBalance);
  }

  const next = [...goals];
  next[index] = nextGoal;
  await saveGoals(next);
  return { error: null };
}

/**
 * @param {string} goalId
 * @returns {Promise<import('../schema').Goal[]>}
 */
export async function replaceGoalsAfterArchive(goalId) {
  const goals = await loadGoals();
  const next = archiveGoal(goals, goalId);
  await saveGoals(next);
  return next;
}

/**
 * Resets saved/paid-down progress on an active goal. Funding rules are kept.
 * Debt goals also restore the linked plan debt to its starting balance.
 * @param {string} goalId
 * @returns {Promise<{ error: 'goal_not_found'|'not_resettable'|null }>}
 */
export async function resetGoalProgress(goalId) {
  const goals = await loadGoals();
  const index = goals.findIndex((g) => g.id === goalId);
  if (index === -1) return { error: 'goal_not_found' };

  const goal = goals[index];
  if (goal.lifecycleStatus !== 'active' || goal.type === 'reduceCosts') {
    return { error: 'not_resettable' };
  }

  const startingBalance = goal.type === 'debt'
    ? (Number(goal.startingPrincipal) || Number(goal.targetAmount) || 0)
    : 0;

  const nextGoals = [...goals];
  nextGoals[index] = {
    ...goal,
    currentAmount: 0,
    paceStatus: 'on_track',
    previousDebtBalance: goal.type === 'debt' ? startingBalance : null,
  };

  if (goal.type === 'debt' && goal.linkedDebtId) {
    const debts = [...((await getData('beaverr_debts')) || [])];
    const nextDebts = debts.map((debt, debtIndex) => {
      const id = resolveDebtId(debt, debtIndex);
      if (id !== goal.linkedDebtId) return debt;
      return {
        ...debt,
        id,
        balance: startingBalance,
        readOnly: false,
        paidOffAt: null,
      };
    });
    await setData('beaverr_debts', nextDebts);
  }

  await saveGoals(nextGoals);
  return { error: null };
}
