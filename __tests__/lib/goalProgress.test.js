import {
  computePaidDown,
  computeProgressPercent,
  computeSavingsProgressPercent,
  isGoalComplete,
  recalculateDebtGoalFromBalance,
} from '../../lib/goals/goalProgress';

describe('goalProgress', () => {
  test('computePaidDown clamps at zero', () => {
    expect(computePaidDown(10000, 4000)).toBe(6000);
    expect(computePaidDown(10000, 12000)).toBe(0);
  });

  test('computeSavingsProgressPercent caps at 100', () => {
    expect(computeSavingsProgressPercent(5000, 10000)).toBe(50);
    expect(computeSavingsProgressPercent(12000, 10000)).toBe(100);
  });

  test('debt goal completes at zero balance', () => {
    const goal = {
      type: 'debt',
      startingPrincipal: 5000,
      targetAmount: 5000,
      currentAmount: 5000,
    };
    expect(isGoalComplete(goal, 0)).toBe(true);
    expect(computeProgressPercent(goal, 0)).toBe(100);
  });

  test('recalculateDebtGoalFromBalance marks regressed when balance rises', () => {
    const goal = {
      type: 'debt',
      startingPrincipal: 10000,
      targetAmount: 10000,
      currentAmount: 5000,
      previousDebtBalance: 5000,
      paceStatus: 'on_track',
    };
    const next = recalculateDebtGoalFromBalance(goal, 7000, 5000);
    expect(next.currentAmount).toBe(3000);
    expect(next.paceStatus).toBe('regressed');
  });
});
