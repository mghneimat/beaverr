import { roundMoney } from '../finance';
import { debitStashRef, getStashBalance } from '../stashTransfers';
import { computePaidDown, computeRemainingToTarget } from './goalProgress';
import { todayIsoDate } from './goalIds';
import { advanceNextRunDate } from './goalFundingSchedule';
import { logGoalFundingMovement } from '../stashMovements';

/**
 * @param {import('../schema').GoalFundingRule} rule
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isFundingDue(rule, now = new Date()) {
  const today = todayIsoDate(now);
  if (!rule.nextRunDate) return false;
  if (today < rule.nextRunDate) return false;
  if (rule.lastProcessedAt === today) return false;
  return true;
}

/**
 * @param {import('../schema').DebtEntry[]} debts
 * @param {string} debtId
 * @param {number} amount
 * @returns {{ debts: import('../schema').DebtEntry[], applied: number }}
 */
export function applyDebtPrincipalPayment(debts, debtId, amount) {
  const amt = Math.max(0, roundMoney(Number(amount) || 0));
  if (amt <= 0) return { debts, applied: 0 };

  let applied = 0;
  const next = debts.map((debt, index) => {
    const id = debt.id || `debt_${index}`;
    if (id !== debtId) return debt;
    const oldBalance = Math.max(0, roundMoney(Number(debt.balance) || 0));
    applied = roundMoney(Math.min(amt, oldBalance));
    const balance = Math.max(0, roundMoney(oldBalance - applied));
    return { ...debt, id, balance };
  });

  return { debts: next, applied };
}

/**
 * @param {import('../schema').Goal} goal
 * @param {import('../schema').GoalFundingRule} rule
 * @param {import('../schema').Budget} budget
 * @param {import('../schema').Income|null|undefined} income
 * @param {import('../schema').DebtEntry[]} debts
 * @returns {{
 *   goal: import('../schema').Goal,
 *   budget: import('../schema').Budget,
 *   income: import('../schema').Income|null|undefined,
 *   debts: import('../schema').DebtEntry[],
 *   error: 'empty_source'|'insufficient'|'goal_at_target'|null,
 *   transferred: number,
 * }}
 */
export function applyFundingRule(goal, rule, budget, income, debts) {
  const stashRef = /** @type {import('../stashTransfers').StashRef} */ (rule.stashRef);
  const amount = roundMoney(Number(rule.amount) || 0);
  let nextBudget = { ...budget };
  const nextIncome = income && typeof income === 'object' ? { ...income } : income;
  const nextDebts = [...debts];

  if (amount <= 0) {
    return {
      goal,
      budget: nextBudget,
      income: nextIncome,
      debts: nextDebts,
      error: null,
      transferred: 0,
    };
  }

  let debtBalance;
  if (goal.type === 'debt' && goal.linkedDebtId) {
    const debt = nextDebts.find((d, i) => (d.id || `debt_${i}`) === goal.linkedDebtId);
    debtBalance = debt ? Number(debt.balance) : undefined;
  }
  const remainingToTarget = computeRemainingToTarget(goal, debtBalance);
  if (remainingToTarget !== null && remainingToTarget <= 0) {
    return {
      goal,
      budget: nextBudget,
      income: nextIncome,
      debts: nextDebts,
      error: 'goal_at_target',
      transferred: 0,
    };
  }

  const available = getStashBalance(nextBudget, nextIncome, stashRef);
  if (available <= 0) {
    return {
      goal,
      budget: nextBudget,
      income: nextIncome,
      debts: nextDebts,
      error: 'empty_source',
      transferred: 0,
    };
  }

  let transferAmount = Math.min(amount, available);
  if (remainingToTarget !== null) {
    transferAmount = Math.min(transferAmount, remainingToTarget);
  }
  transferAmount = roundMoney(transferAmount);
  if (transferAmount <= 0) {
    return {
      goal,
      budget: nextBudget,
      income: nextIncome,
      debts: nextDebts,
      error: null,
      transferred: 0,
    };
  }
  if (!debitStashRef(nextBudget, nextIncome, stashRef, transferAmount)) {
    return {
      goal,
      budget: nextBudget,
      income: nextIncome,
      debts: nextDebts,
      error: 'insufficient',
      transferred: 0,
    };
  }

  let nextGoal = { ...goal };
  if (goal.type === 'debt' && goal.linkedDebtId) {
    const payment = applyDebtPrincipalPayment(nextDebts, goal.linkedDebtId, transferAmount);
    const debt = payment.debts.find((d, i) => (d.id || `debt_${i}`) === goal.linkedDebtId);
    const start = Number(goal.startingPrincipal) || 0;
    const balance = debt ? Number(debt.balance) || 0 : 0;
    nextGoal = {
      ...nextGoal,
      currentAmount: computePaidDown(start, balance),
      previousDebtBalance: balance,
    };
    nextBudget = logGoalFundingMovement(
      nextBudget,
      nextGoal,
      stashRef,
      payment.applied,
      todayIsoDate(),
    );
    return {
      goal: nextGoal,
      budget: nextBudget,
      income: nextIncome,
      debts: payment.debts,
      error: null,
      transferred: payment.applied,
    };
  }

  nextGoal = {
    ...nextGoal,
    currentAmount: roundMoney((Number(goal.currentAmount) || 0) + transferAmount),
  };

  nextBudget = logGoalFundingMovement(
    nextBudget,
    nextGoal,
    stashRef,
    transferAmount,
    todayIsoDate(),
  );

  return {
    goal: nextGoal,
    budget: nextBudget,
    income: nextIncome,
    debts: nextDebts,
    error: null,
    transferred: transferAmount,
  };
}

/**
 * @param {import('../schema').Goal[]} goals
 * @param {import('../schema').Budget} budget
 * @param {import('../schema').Income|null|undefined} income
 * @param {import('../schema').DebtEntry[]} debts
 * @param {Date} [now]
 * @returns {{
 *   goals: import('../schema').Goal[],
 *   budget: import('../schema').Budget,
 *   income: import('../schema').Income|null|undefined,
 *   debts: import('../schema').DebtEntry[],
 *   fundingAlerts: { goalId: string, ruleId: string, reason: string }[],
 * }}
 */
export function processGoalFundingIfDue(goals, budget, income, debts, now = new Date()) {
  const today = todayIsoDate(now);
  let nextBudget = { ...budget };
  let nextIncome = income && typeof income === 'object' ? { ...income } : income;
  let nextDebts = [...debts];
  /** @type {import('../schema').Goal[]} */
  const nextGoals = [];
  /** @type {{ goalId: string, ruleId: string, reason: string }[]} */
  const fundingAlerts = [];

  goals.forEach((goal) => {
    if (goal.lifecycleStatus !== 'active' || !goal.fundingRules?.length) {
      nextGoals.push(goal);
      return;
    }

    let workingGoal = { ...goal };
    const sortedRules = [...goal.fundingRules].sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0),
    );

    const updatedRules = sortedRules
      .map((rule) => {
        if (!isFundingDue(rule, now)) return rule;

        const result = applyFundingRule(
          workingGoal,
          rule,
          nextBudget,
          nextIncome,
          nextDebts,
        );
        workingGoal = result.goal;
        nextBudget = result.budget;
        nextIncome = result.income;
        nextDebts = result.debts;

        if (result.error === 'empty_source') {
          fundingAlerts.push({
            goalId: goal.id,
            ruleId: rule.id,
            reason: 'empty_source',
          });
          return rule;
        }

        if (result.transferred > 0) {
          if (rule.frequency === 'once') {
            return null;
          }
          const advanced = advanceNextRunDate(rule);
          return {
            ...rule,
            lastProcessedAt: today,
            nextRunDate: advanced || rule.nextRunDate,
          };
        }
        return rule;
      })
      .filter(Boolean);

    nextGoals.push({ ...workingGoal, fundingRules: updatedRules });
  });

  return {
    goals: nextGoals,
    budget: nextBudget,
    income: nextIncome,
    debts: nextDebts,
    fundingAlerts,
  };
}
