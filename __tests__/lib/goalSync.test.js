import { syncGoalsWithSources, finalizeGoalStates } from '../../lib/goals/goalSync';

const t = (key) => key;

describe('goalSync', () => {
  test('auto-creates debt goal for new debt', () => {
    const debts = [{ id: 'd1', type: 'creditCard', balance: 5000, minPayment: 200, apr: 10 }];
    const next = syncGoalsWithSources([], debts, {}, t);
    expect(next).toHaveLength(1);
    expect(next[0].type).toBe('debt');
    expect(next[0].linkedDebtId).toBe('d1');
    expect(next[0].startingPrincipal).toBe(5000);
  });

  test('puts goal on hold when debt removed', () => {
    const goals = [{
      id: 'g1',
      type: 'debt',
      linkedDebtId: 'd1',
      lifecycleStatus: 'active',
      startingPrincipal: 1000,
      targetAmount: 1000,
      currentAmount: 200,
      fundingRules: [{ id: 'r1', amount: 50, frequency: 'monthly', stashRef: 'looseCash', priority: 0 }],
    }];
    const next = syncGoalsWithSources(goals, [], {}, t);
    expect(next[0].lifecycleStatus).toBe('on_hold');
  });

  test('finalizeGoalStates completes debt goal at zero balance', () => {
    const goals = [{
      id: 'g1',
      type: 'debt',
      linkedDebtId: 'd1',
      lifecycleStatus: 'active',
      startingPrincipal: 1000,
      targetAmount: 1000,
      currentAmount: 1000,
      fundingRules: [],
      completionCount: 0,
      name: 'Card',
    }];
    const debts = [{ id: 'd1', balance: 0, minPayment: 0, apr: 0 }];
    const result = finalizeGoalStates(goals, debts);
    expect(result.goals[0].lifecycleStatus).toBe('completed');
    expect(result.debts[0].readOnly).toBe(true);
    expect(result.pendingCelebrations).toContain('g1');
  });
});
