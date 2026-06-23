import { applyFundingRule } from '../../lib/goals/goalFunding';

describe('goalFunding', () => {
  test('debt funding debits stash and reduces balance', () => {
    const goal = {
      id: 'g1',
      type: 'debt',
      linkedDebtId: 'debt_0',
      startingPrincipal: 1000,
      targetAmount: 1000,
      currentAmount: 0,
      fundingRules: [],
    };
    const budget = { looseMoneyBalance: 500 };
    const debts = [{ id: 'debt_0', balance: 1000, minPayment: 100 }];

    const result = applyFundingRule(
      goal,
      { id: 'r1', stashRef: 'looseCash', amount: 200, frequency: 'monthly', priority: 0 },
      budget,
      {},
      debts,
    );

    expect(result.error).toBeNull();
    expect(result.budget.looseMoneyBalance).toBe(300);
    expect(result.debts[0].balance).toBe(800);
    expect(result.goal.currentAmount).toBe(200);
  });

  test('empty source returns empty_source error', () => {
    const goal = {
      id: 'g1',
      type: 'custom',
      currentAmount: 0,
      fundingRules: [],
    };
    const result = applyFundingRule(
      goal,
      { id: 'r1', stashRef: 'looseCash', amount: 100, frequency: 'monthly', priority: 0 },
      { looseMoneyBalance: 0 },
      {},
      [],
    );
    expect(result.error).toBe('empty_source');
  });

  test('caps transfer at remaining target for custom goals', () => {
    const goal = {
      id: 'g1',
      type: 'custom',
      targetAmount: 1000,
      currentAmount: 900,
      fundingRules: [],
    };
    const result = applyFundingRule(
      goal,
      { id: 'r1', stashRef: 'looseCash', amount: 200, frequency: 'monthly', priority: 0 },
      { looseMoneyBalance: 500 },
      {},
      [],
    );

    expect(result.error).toBeNull();
    expect(result.transferred).toBe(100);
    expect(result.goal.currentAmount).toBe(1000);
    expect(result.budget.looseMoneyBalance).toBe(400);
  });

  test('returns goal_at_target when goal is already funded', () => {
    const goal = {
      id: 'g1',
      type: 'custom',
      targetAmount: 1000,
      currentAmount: 1000,
      fundingRules: [],
    };
    const result = applyFundingRule(
      goal,
      { id: 'r1', stashRef: 'looseCash', amount: 100, frequency: 'monthly', priority: 0 },
      { looseMoneyBalance: 500 },
      {},
      [],
    );

    expect(result.error).toBe('goal_at_target');
    expect(result.transferred).toBe(0);
    expect(result.budget.looseMoneyBalance).toBe(500);
  });

  test('caps debt funding at remaining balance', () => {
    const goal = {
      id: 'g1',
      type: 'debt',
      linkedDebtId: 'debt_0',
      startingPrincipal: 1000,
      targetAmount: 1000,
      currentAmount: 900,
      fundingRules: [],
    };
    const budget = { looseMoneyBalance: 500 };
    const debts = [{ id: 'debt_0', balance: 100, minPayment: 100 }];

    const result = applyFundingRule(
      goal,
      { id: 'r1', stashRef: 'looseCash', amount: 200, frequency: 'monthly', priority: 0 },
      budget,
      {},
      debts,
    );

    expect(result.error).toBeNull();
    expect(result.transferred).toBe(100);
    expect(result.budget.looseMoneyBalance).toBe(400);
    expect(result.debts[0].balance).toBe(0);
    expect(result.goal.currentAmount).toBe(1000);
  });
});
