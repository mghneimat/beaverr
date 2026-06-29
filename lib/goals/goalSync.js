import {
  GOAL_TYPES,
  hasTargetSavingsGoal,
  normalizeIncomeGoalFields,
} from '../incomeGoals';
import { isGoalComplete, syncDebtGoalProgress } from './goalProgress';
import { applyGoalPace } from './goalPace';
import { createGoalId, resolveDebtId, todayIsoDate } from './goalIds';

const EMERGENCY_GOAL_KEY = 'emergency';

/**
 * @param {import('../schema').Goal[]} goals
 * @returns {import('../schema').Goal|undefined}
 */
export function findEmergencyGoal(goals) {
  return goals.find(
    (g) => g.type === 'savings' && g.autoCreated && g.id.includes(EMERGENCY_GOAL_KEY),
  ) ?? goals.find((g) => g.type === 'savings' && g.autoCreated);
}

/**
 * @param {import('../schema').Goal[]} goals
 * @param {string} debtId
 * @returns {import('../schema').Goal|undefined}
 */
export function findDebtGoal(goals, debtId) {
  return goals.find((g) => g.type === 'debt' && g.linkedDebtId === debtId);
}

/**
 * @param {string} name
 * @param {(key: string) => string} t
 * @returns {import('../schema').Goal}
 */
export function buildEmergencyGoalFromIncome(income, t) {
  const name = income?.goalDescription?.trim()
    || t('dashboard.goalsScreen.emergencyDefaultName');
  return {
    id: `goal_${EMERGENCY_GOAL_KEY}_${Date.now()}`,
    type: 'savings',
    name,
    description: income?.goalDescription || null,
    endDate: income?.goalDate || null,
    targetAmount: Number(income?.goalAmount) || 0,
    currentAmount: Math.min(
      Number(income?.goalAmount) || 0,
      Math.max(0, Number(income?.savingsBalance) || 0),
    ),
    startingPrincipal: null,
    linkedDebtId: null,
    lifecycleStatus: 'active',
    paceStatus: 'on_track',
    fundingRules: [],
    autoCreated: true,
    completionCount: 0,
    completedAt: null,
    archivedAt: null,
    createdAt: todayIsoDate(),
    previousDebtBalance: null,
  };
}

/**
 * @param {import('../schema').DebtEntry} debt
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function resolveDebtEntryLabel(debt, t) {
  const typeKey = `onboarding.debts.debtDetails.${debt.type || 'other'}`;
  const translated = t(typeKey);
  const label = translated !== typeKey
    ? translated
    : t('dashboard.alertsScreen.fallback.debt');
  return debt.creditor?.trim() || label;
}

/**
 * @param {import('../schema').DebtEntry} debt
 * @param {number} index
 * @param {(key: string, params?: object) => string} t
 * @returns {import('../schema').Goal}
 */
export function buildDebtGoalFromEntry(debt, index, t, endDate = null) {
  const debtId = resolveDebtId(debt, index);
  const balance = Number(debt.balance) || 0;
  const resolvedEndDate = typeof endDate === 'string' && endDate.trim()
    ? endDate.trim()
    : null;

  return {
    id: createGoalId(),
    type: 'debt',
    name: resolveDebtEntryLabel(debt, t),
    description: debt.notes || null,
    endDate: resolvedEndDate,
    targetAmount: balance,
    currentAmount: 0,
    startingPrincipal: balance,
    linkedDebtId: debtId,
    lifecycleStatus: 'active',
    paceStatus: 'on_track',
    fundingRules: [],
    autoCreated: true,
    completionCount: 0,
    completedAt: null,
    archivedAt: null,
    createdAt: todayIsoDate(),
    previousDebtBalance: balance,
  };
}

/**
 * @param {(key: string) => string} t
 * @returns {import('../schema').Goal}
 */
export function buildReduceCostsGoal(t) {
  return {
    id: createGoalId(),
    type: 'reduceCosts',
    name: t('dashboard.goalsScreen.reduceCosts'),
    description: t('dashboard.goalsScreen.reduceCostsHelper'),
    endDate: null,
    targetAmount: 0,
    currentAmount: 0,
    startingPrincipal: null,
    linkedDebtId: null,
    lifecycleStatus: 'active',
    paceStatus: 'on_track',
    fundingRules: [],
    autoCreated: true,
    completionCount: 0,
    completedAt: null,
    archivedAt: null,
    createdAt: todayIsoDate(),
    previousDebtBalance: null,
  };
}

/**
 * @param {import('../schema').Goal[]} goals
 * @param {import('../schema').DebtEntry[]} debts
 * @param {object|null|undefined} income
 * @param {(key: string, params?: object) => string} t
 * @returns {import('../schema').Goal[]}
 */
export function syncGoalsWithSources(goals, debts, income, t) {
  /** @type {import('../schema').Goal[]} */
  let next = [...goals];
  const activeDebtIds = new Set(
    (debts || []).map((debt, index) => resolveDebtId(debt, index)),
  );

  if (hasTargetSavingsGoal(income) && !findEmergencyGoal(next)) {
    next.push(buildEmergencyGoalFromIncome(income, t));
  }

  const { goalType } = normalizeIncomeGoalFields(income);
  const hasReduceCosts = goalType === GOAL_TYPES.REDUCE_COSTS
    || goalType === GOAL_TYPES.REDUCE_AND_SAVE;
  if (hasReduceCosts && !next.some((g) => g.type === 'reduceCosts' && g.autoCreated)) {
    next.push(buildReduceCostsGoal(t));
  }

  (debts || []).forEach((debt, index) => {
    const debtId = resolveDebtId(debt, index);
    const existing = findDebtGoal(next, debtId);
    if (!existing) {
      if (!debt.readOnly) {
        next.push(buildDebtGoalFromEntry({ ...debt, id: debtId }, index, t));
      }
      return;
    }
    if (existing.lifecycleStatus === 'completed' || existing.lifecycleStatus === 'archived') {
      return;
    }
    if (!activeDebtIds.has(debtId)) {
      next = next.map((g) => (
        g.id === existing.id
          ? { ...g, lifecycleStatus: 'on_hold', paceStatus: null }
          : g
      ));
      return;
    }
    next = next.map((g) => {
      if (g.id !== existing.id) return g;
      const synced = syncDebtGoalProgress(g, { ...debt, id: debtId });
      return synced.lifecycleStatus === 'on_hold'
        ? { ...synced, lifecycleStatus: 'active' }
        : synced;
    });
  });

  next = next.map((g) => {
    if (g.type !== 'debt' || !g.linkedDebtId) return g;
    if (!activeDebtIds.has(g.linkedDebtId) && g.lifecycleStatus === 'active') {
      return { ...g, lifecycleStatus: 'on_hold', paceStatus: null };
    }
    return g;
  });

  return next;
}

/**
 * @param {import('../schema').Goal[]} goals
 * @param {string} stashId
 * @returns {import('../schema').Goal[]}
 */
export function pauseGoalsUsingStash(goals, stashId) {
  const ref = `stash:${stashId}`;
  return goals.map((goal) => {
    if (goal.lifecycleStatus !== 'active') return goal;
    const usesStash = (goal.fundingRules || []).some((rule) => rule.stashRef === ref);
    if (!usesStash) return goal;
    return { ...goal, lifecycleStatus: 'paused', paceStatus: null };
  });
}

/**
 * @param {import('../schema').DebtEntry[]} debts
 * @param {string} debtId
 * @returns {import('../schema').DebtEntry[]}
 */
export function lockDebtAsPaidOff(debts, debtId) {
  const today = todayIsoDate();
  return debts.map((debt, index) => {
    const id = resolveDebtId(debt, index);
    if (id !== debtId) return debt;
    return {
      ...debt,
      id,
      balance: 0,
      readOnly: true,
      paidOffAt: today,
    };
  });
}

/**
 * @param {import('../schema').Goal[]} goals
 * @param {import('../schema').DebtEntry[]} debts
 * @param {Date} [now]
 * @returns {{
 *   goals: import('../schema').Goal[],
 *   debts: import('../schema').DebtEntry[],
 *   pendingCelebrations: string[],
 * }}
 */
export function finalizeGoalStates(goals, debts, now = new Date()) {
  /** @type {string[]} */
  const pendingCelebrations = [];
  let nextDebts = [...debts];

  const nextGoals = goals.map((goal) => {
    if (goal.lifecycleStatus === 'archived' || goal.lifecycleStatus === 'completed') {
      return applyGoalPace(goal);
    }

    let debtBalance;
    if (goal.type === 'debt' && goal.linkedDebtId) {
      const debt = nextDebts.find((d, i) => resolveDebtId(d, i) === goal.linkedDebtId);
      debtBalance = debt ? Number(debt.balance) : undefined;
    }

    let working = goal.lifecycleStatus === 'active'
      ? applyGoalPace(goal, debtBalance, now)
      : goal;

    if (working.lifecycleStatus !== 'active') return working;
    if (!isGoalComplete(working, debtBalance)) return working;

    const completionCount = (working.completionCount || 0) + 1;
    pendingCelebrations.push(working.id);
    working = {
      ...working,
      lifecycleStatus: 'completed',
      completionCount,
      completedAt: todayIsoDate(now),
      fundingRules: [],
      paceStatus: 'on_track',
    };

    if (working.type === 'debt' && working.linkedDebtId) {
      nextDebts = lockDebtAsPaidOff(nextDebts, working.linkedDebtId);
    }

    return working;
  });

  return { goals: nextGoals, debts: nextDebts, pendingCelebrations };
}

/**
 * @param {import('../schema').Goal[]} goals
 * @param {string} goalId
 * @returns {import('../schema').Goal[]}
 */
export function archiveGoal(goals, goalId) {
  const today = todayIsoDate();
  return goals.map((g) => (
    g.id === goalId && g.lifecycleStatus === 'completed'
      ? { ...g, lifecycleStatus: 'archived', archivedAt: today }
      : g
  ));
}

/**
 * @param {import('../schema').Goal} goal
 * @param {Partial<import('../schema').Goal>} patch
 * @returns {import('../schema').Goal}
 */
export function updateGoal(goal, patch) {
  if (goal.lifecycleStatus === 'archived') {
    return goal;
  }
  return { ...goal, ...patch };
}

/**
 * @param {import('../schema').Goal[]} goals
 * @param {import('../schema').DebtEntry[]} debts
 * @param {string} debtId
 * @returns {import('../schema').Goal|undefined}
 */
export function getGoalForDebt(goals, debts, debtId) {
  return findDebtGoal(goals, debtId);
}

/**
 * @param {import('../schema').DebtEntry[]} debts
 * @param {number} index
 * @returns {boolean}
 */
export function isDebtReadOnly(debts, index) {
  const debt = debts[index];
  return Boolean(debt?.readOnly);
}
