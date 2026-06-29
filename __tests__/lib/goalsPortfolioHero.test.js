import { computeGoalsPortfolioHero } from '../../lib/goals/goalsPortfolioHero';

describe('computeGoalsPortfolioHero', () => {
  test('counts on-track saving goals and sums debt remaining', () => {
    const goals = [
      {
        id: 'g1',
        type: 'savings',
        lifecycleStatus: 'active',
        endDate: '12/2027',
        paceStatus: 'on_track',
        targetAmount: 10000,
        currentAmount: 2000,
      },
      {
        id: 'g2',
        type: 'custom',
        lifecycleStatus: 'active',
        endDate: '06/2027',
        paceStatus: 'behind',
        targetAmount: 5000,
        currentAmount: 1000,
      },
      {
        id: 'g3',
        type: 'savings',
        lifecycleStatus: 'on_hold',
        paceStatus: null,
        targetAmount: 3000,
        currentAmount: 0,
      },
      {
        id: 'd1',
        type: 'debt',
        lifecycleStatus: 'active',
        linkedDebtId: 'debt_1',
        startingPrincipal: 10000,
        targetAmount: 10000,
        currentAmount: 3000,
      },
    ];
    const debts = [{ id: 'debt_1', balance: 7000 }];

    expect(computeGoalsPortfolioHero(goals, debts)).toEqual({
      onTrackCount: 1,
      paceEligibleCount: 2,
      behindCount: 1,
      onHoldCount: 1,
      hasSavingGoals: true,
      debtRemaining: 7000,
      debtGoalCount: 1,
    });
  });

  test('excludes archived goals and reduce-costs from on-track ratio', () => {
    const goals = [
      {
        id: 'g1',
        type: 'savings',
        lifecycleStatus: 'archived',
        endDate: '12/2027',
        paceStatus: 'on_track',
      },
      {
        id: 'rc1',
        type: 'reduceCosts',
        lifecycleStatus: 'active',
        paceStatus: 'on_track',
      },
    ];

    expect(computeGoalsPortfolioHero(goals, [])).toEqual({
      onTrackCount: 0,
      paceEligibleCount: 0,
      behindCount: 0,
      onHoldCount: 0,
      hasSavingGoals: false,
      debtRemaining: 0,
      debtGoalCount: 0,
    });
  });

  test('uses goal progress when linked debt entry is missing', () => {
    const goals = [
      {
        id: 'd1',
        type: 'debt',
        lifecycleStatus: 'active',
        startingPrincipal: 5000,
        targetAmount: 5000,
        currentAmount: 2000,
      },
    ];

    expect(computeGoalsPortfolioHero(goals, [])).toEqual({
      onTrackCount: 0,
      paceEligibleCount: 0,
      behindCount: 0,
      onHoldCount: 0,
      hasSavingGoals: false,
      debtRemaining: 3000,
      debtGoalCount: 1,
    });
  });
});
