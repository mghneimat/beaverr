import {
  appendStashMovement,
  backfillStashMovementsFromLegacyHistory,
  getMovementsForStashRef,
  logStashTransferMovements,
  signedMovementAmount,
} from '../../lib/stashMovements';
import {
  buildLinkedGoalRows,
  sumPlannedMonthlyOutflowFromStash,
} from '../../lib/stashGoalLinkage';
import { describeStashMovement } from '../../lib/stashMovementDisplay';

describe('stashMovements', () => {
  it('logs transfer in and out on two tabs', () => {
    let budget = {};
    budget = logStashTransferMovements(budget, null, 'looseCash', 'savings', 100, '2026-06-01');
    const loose = getMovementsForStashRef(budget, 'looseCash');
    const savings = getMovementsForStashRef(budget, 'savings');
    expect(loose).toHaveLength(1);
    expect(savings).toHaveLength(1);
    expect(loose[0].direction).toBe('out');
    expect(savings[0].direction).toBe('in');
    expect(signedMovementAmount(loose[0])).toBe(-100);
    expect(signedMovementAmount(savings[0])).toBe(100);
  });

  it('backfills from day and month history once', () => {
    const budget = {
      dayEndHistory: [{
        date: '2026-06-10',
        toLooseMoney: 50,
        dailyAllowance: 100,
        spent: 50,
        leftover: 50,
      }],
      monthEndHistory: [{
        period: '2026-05',
        leftover: 200,
        spent: 800,
        destination: 'savings',
        amount: 200,
      }],
    };
    const first = backfillStashMovementsFromLegacyHistory(budget);
    expect(first.changed).toBe(true);
    expect(getMovementsForStashRef(first.budget, 'looseCash')).toHaveLength(1);
    expect(getMovementsForStashRef(first.budget, 'savings')).toHaveLength(1);
    const second = backfillStashMovementsFromLegacyHistory(first.budget);
    expect(second.changed).toBe(false);
  });
});

describe('stashGoalLinkage', () => {
  const t = (key) => key;
  const goals = [{
    id: 'g1',
    name: 'Vacation',
    lifecycleStatus: 'active',
    fundingRules: [{
      id: 'r1',
      stashRef: 'looseCash',
      amount: 100,
      frequency: 'monthly',
      priority: 0,
    }],
  }];

  it('finds linked goals and monthly outflow', () => {
    const rows = buildLinkedGoalRows(goals, 'looseCash', {}, t, 'Kč');
    expect(rows).toHaveLength(1);
    expect(rows[0].goal.name).toBe('Vacation');
    expect(sumPlannedMonthlyOutflowFromStash(goals, 'looseCash')).toBe(100);
  });
});

describe('stashMovementDisplay', () => {
  const t = (key, params) => `${key}:${params?.name || ''}`;

  it('describes goal funding rows', () => {
    const label = describeStashMovement({
      type: 'goal_funding',
      counterpartyLabel: 'Holiday',
      counterpartyKind: 'goal',
    }, {}, t);
    expect(label).toContain('Holiday');
  });
});
