import { roundMoney } from '../finance';
import { goalHasDeadline } from './goalPace';
import { computeRemainingToTarget } from './goalProgress';

/**
 * @param {import('../schema').Goal} goal
 * @returns {boolean}
 */
function isSavingGoal(goal) {
  return goal.type !== 'debt' && goal.type !== 'reduceCosts';
}

/**
 * @param {import('../schema').DebtEntry[]} debts
 * @param {import('../schema').Goal} goal
 * @returns {number|undefined}
 */
function resolveDebtBalance(debts, goal) {
  if (goal.type !== 'debt' || !goal.linkedDebtId) return undefined;
  const debt = (debts || []).find((d, i) => (d.id || `debt_${i}`) === goal.linkedDebtId);
  return debt ? Number(debt.balance) : undefined;
}

/**
 * Portfolio headline metrics for the Goals tab hero card.
 * @param {import('../schema').Goal[]} goals
 * @param {import('../schema').DebtEntry[]} [debts]
 * @returns {{
 *   onTrackCount: number,
 *   paceEligibleCount: number,
 *   behindCount: number,
 *   onHoldCount: number,
 *   hasSavingGoals: boolean,
 *   debtRemaining: number,
 *   debtGoalCount: number,
 * }}
 */
export function computeGoalsPortfolioHero(goals, debts = []) {
  const visible = (goals || []).filter((g) => g.lifecycleStatus !== 'archived');
  const savingGoals = visible.filter(isSavingGoal);
  const debtGoals = visible.filter((g) => g.type === 'debt');

  const paceEligible = savingGoals.filter(
    (g) => g.lifecycleStatus === 'active' && goalHasDeadline(g),
  );
  const onTrackCount = paceEligible.filter(
    (g) => g.paceStatus === 'on_track' || g.paceStatus === 'ahead',
  ).length;
  const behindCount = paceEligible.filter(
    (g) => g.paceStatus === 'behind' || g.paceStatus === 'regressed',
  ).length;
  const onHoldCount = savingGoals.filter((g) => g.lifecycleStatus === 'on_hold').length;

  const activeDebtGoals = debtGoals.filter(
    (g) => g.lifecycleStatus === 'active' || g.lifecycleStatus === 'on_hold',
  );

  let debtRemaining = 0;
  for (const goal of activeDebtGoals) {
    const remaining = computeRemainingToTarget(goal, resolveDebtBalance(debts, goal));
    if (remaining != null) debtRemaining += remaining;
  }

  return {
    onTrackCount,
    paceEligibleCount: paceEligible.length,
    behindCount,
    onHoldCount,
    hasSavingGoals: savingGoals.some(
      (g) => g.lifecycleStatus === 'active' || g.lifecycleStatus === 'on_hold',
    ),
    debtRemaining: roundMoney(debtRemaining),
    debtGoalCount: activeDebtGoals.length,
  };
}
