import {
  computeStashBalanceBreakdown,
  sumCommittedGoalFundingFromStash,
  sumUpcomingReservedFromStash,
} from '../../lib/stashGoalLinkage';

describe('sumCommittedGoalFundingFromStash', () => {
  test('sums goal_funding outflows for the stash', () => {
    const movements = [
      { stashRef: 'looseCash', direction: 'out', type: 'goal_funding', amount: 10000 },
      { stashRef: 'looseCash', direction: 'out', type: 'transfer_out', amount: 500 },
      { stashRef: 'savings', direction: 'out', type: 'goal_funding', amount: 200 },
    ];

    expect(sumCommittedGoalFundingFromStash(movements, 'looseCash')).toBe(10000);
  });
});

describe('sumUpcomingReservedFromStash', () => {
  const goals = [
    {
      id: 'g1',
      lifecycleStatus: 'active',
      fundingRules: [
        { id: 'r1', stashRef: 'looseCash', amount: 121, frequency: 'monthly' },
        { id: 'r2', stashRef: 'savings', amount: 50, frequency: 'monthly' },
      ],
    },
    {
      id: 'g2',
      lifecycleStatus: 'active',
      fundingRules: [
        {
          id: 'r3',
          stashRef: 'looseCash',
          amount: 200,
          frequency: 'once',
          lastProcessedAt: '2026-06-01',
        },
        { id: 'r4', stashRef: 'looseCash', amount: 80, frequency: 'once' },
      ],
    },
  ];

  test('sums active rule amounts for the stash, skipping processed one-time rules', () => {
    expect(sumUpcomingReservedFromStash(goals, 'looseCash')).toBe(201);
  });

  test('returns zero when no rules target the stash', () => {
    expect(sumUpcomingReservedFromStash(goals, 'stash:missing')).toBe(0);
  });
});

describe('computeStashBalanceBreakdown', () => {
  test('includes executed one-time goal funding in total and reserved', () => {
    const goals = [{
      id: 'g1',
      lifecycleStatus: 'active',
      fundingRules: [{ id: 'r1', stashRef: 'looseCash', amount: 121, frequency: 'monthly' }],
    }];
    const movements = [
      { stashRef: 'looseCash', direction: 'out', type: 'goal_funding', amount: 10000 },
    ];

    expect(computeStashBalanceBreakdown(60938.55, goals, 'looseCash', movements)).toEqual({
      inTab: 60938.55,
      total: 70938.55,
      reserved: 10121,
      available: 60817.55,
    });
  });

  test('splits in-tab balance into reserved and available without outflows', () => {
    const goals = [{
      id: 'g1',
      lifecycleStatus: 'active',
      fundingRules: [{ id: 'r1', stashRef: 'looseCash', amount: 121, frequency: 'monthly' }],
    }];

    expect(computeStashBalanceBreakdown(60938.55, goals, 'looseCash')).toEqual({
      inTab: 60938.55,
      total: 60938.55,
      reserved: 121,
      available: 60817.55,
    });
  });

  test('available is zero when pending rules exceed in-tab balance', () => {
    const goals = [{
      id: 'g1',
      lifecycleStatus: 'active',
      fundingRules: [{ id: 'r1', stashRef: 'looseCash', amount: 500, frequency: 'monthly' }],
    }];

    expect(computeStashBalanceBreakdown(100, goals, 'looseCash')).toEqual({
      inTab: 100,
      total: 100,
      reserved: 500,
      available: 0,
    });
  });
});
