import { computeGoalPaceStatus, goalHasDeadline, sumActiveFundingMonthly } from '../../lib/goals/goalPace';
describe('goalPace', () => {
  test('sumActiveFundingMonthly includes weekly rules', () => {
    const goal = {
      lifecycleStatus: 'active',
      fundingRules: [
        { amount: 100, frequency: 'monthly' },
        { amount: 100, frequency: 'weekly' },
      ],
    };
    expect(sumActiveFundingMonthly(goal)).toBeCloseTo(100 + 100 * 4.33, 0);
  });

  test('sumActiveFundingMonthly converts daily and annual rules', () => {
    const goal = {
      lifecycleStatus: 'active',
      fundingRules: [
        { amount: 10, frequency: 'daily' },
        { amount: 1200, frequency: 'annual' },
      ],
    };
    expect(sumActiveFundingMonthly(goal)).toBeCloseTo(10 * 30.44 + 100, 0);
  });

  test('goalHasDeadline is false without endDate', () => {
    expect(goalHasDeadline({
      type: 'debt',
      endDate: null,
    })).toBe(false);
  });

  test('goalHasDeadline is true with endDate', () => {
    expect(goalHasDeadline({
      type: 'savings',
      endDate: '31/12/2026',
    })).toBe(true);
  });

  test('computeGoalPaceStatus returns null without endDate', () => {
    const goal = {
      type: 'debt',
      lifecycleStatus: 'active',
      targetAmount: 47000,
      currentAmount: 0,
      endDate: null,
      fundingRules: [],
    };
    expect(computeGoalPaceStatus(goal)).toBeNull();
  });

  test('computeGoalPaceStatus returns behind without funding', () => {
    const goal = {
      type: 'savings',
      lifecycleStatus: 'active',
      targetAmount: 12000,
      currentAmount: 0,
      endDate: '31/12/2026',
      fundingRules: [],
      paceStatus: null,
    };
    expect(computeGoalPaceStatus(goal)).toBe('behind');
  });
});
