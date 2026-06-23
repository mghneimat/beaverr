import {
  advanceNextRunDate,
  deriveScheduleAnchors,
  storedDateToIso,
} from '../../lib/goals/goalFundingSchedule';
import { isFundingDue, processGoalFundingIfDue } from '../../lib/goals/goalFunding';

describe('goalFundingSchedule', () => {
  test('storedDateToIso converts DD/MM/YYYY', () => {
    expect(storedDateToIso('15/06/2026')).toBe('2026-06-15');
  });

  test('deriveScheduleAnchors extracts day anchors', () => {
    const anchors = deriveScheduleAnchors('2026-06-15');
    expect(anchors.dayOfMonth).toBe(15);
    expect(anchors.dayOfWeek).toBe(1);
  });

  test('advanceNextRunDate moves weekly rule by 7 days', () => {
    const next = advanceNextRunDate({
      frequency: 'weekly',
      nextRunDate: '2026-06-15',
      dayOfMonth: 15,
      dayOfWeek: 1,
    });
    expect(next).toBe('2026-06-22');
  });

  test('advanceNextRunDate returns null for once rules', () => {
    const next = advanceNextRunDate({
      frequency: 'once',
      nextRunDate: '2026-06-15',
    });
    expect(next).toBeNull();
  });

  test('advanceNextRunDate moves daily rule by 1 day', () => {
    const next = advanceNextRunDate({
      frequency: 'daily',
      nextRunDate: '2026-06-15',
    });
    expect(next).toBe('2026-06-16');
  });

  test('advanceNextRunDate moves annual rule by 1 year', () => {
    const next = advanceNextRunDate({
      frequency: 'annual',
      nextRunDate: '2026-06-15',
      dayOfMonth: 15,
    });
    expect(next).toBe('2027-06-15');
  });

  test('advanceNextRunDate moves monthly rule to next month', () => {
    const next = advanceNextRunDate({
      frequency: 'monthly',
      nextRunDate: '2026-06-15',
      dayOfMonth: 15,
    });
    expect(next).toBe('2026-07-15');
  });
});

describe('isFundingDue', () => {
  test('returns false without nextRunDate', () => {
    const rule = { frequency: 'monthly', amount: 100 };
    expect(isFundingDue(rule, new Date('2026-06-18'))).toBe(false);
  });

  test('returns false before nextRunDate', () => {
    const rule = {
      frequency: 'monthly',
      amount: 100,
      nextRunDate: '2026-06-20',
      lastProcessedAt: null,
    };
    expect(isFundingDue(rule, new Date('2026-06-18'))).toBe(false);
  });

  test('returns true on or after nextRunDate', () => {
    const rule = {
      frequency: 'monthly',
      amount: 100,
      nextRunDate: '2026-06-15',
      lastProcessedAt: null,
    };
    expect(isFundingDue(rule, new Date('2026-06-18'))).toBe(true);
  });

  test('returns false if already processed today', () => {
    const rule = {
      frequency: 'monthly',
      amount: 100,
      nextRunDate: '2026-06-15',
      lastProcessedAt: '2026-06-18',
    };
    expect(isFundingDue(rule, new Date('2026-06-18'))).toBe(false);
  });
});

describe('processGoalFundingIfDue scheduling', () => {
  test('does not move money before nextRunDate', () => {
    const goals = [{
      id: 'g1',
      type: 'custom',
      lifecycleStatus: 'active',
      currentAmount: 0,
      fundingRules: [{
        id: 'r1',
        stashRef: 'looseCash',
        amount: 200,
        frequency: 'monthly',
        priority: 0,
        nextRunDate: '2026-12-01',
        dayOfMonth: 1,
        lastProcessedAt: null,
      }],
    }];
    const budget = { looseMoneyBalance: 500 };
    const now = new Date('2026-06-18');

    const result = processGoalFundingIfDue(goals, budget, {}, [], now);

    expect(result.goals[0].currentAmount).toBe(0);
    expect(result.budget.looseMoneyBalance).toBe(500);
  });

  test('moves money on due date and advances schedule', () => {
    const goals = [{
      id: 'g1',
      type: 'custom',
      lifecycleStatus: 'active',
      currentAmount: 0,
      fundingRules: [{
        id: 'r1',
        stashRef: 'looseCash',
        amount: 200,
        frequency: 'monthly',
        priority: 0,
        nextRunDate: '2026-06-15',
        dayOfMonth: 15,
        lastProcessedAt: null,
      }],
    }];
    const budget = { looseMoneyBalance: 500 };
    const now = new Date('2026-06-18');

    const result = processGoalFundingIfDue(goals, budget, {}, [], now);

    expect(result.goals[0].currentAmount).toBe(200);
    expect(result.budget.looseMoneyBalance).toBe(300);
    expect(result.goals[0].fundingRules[0].lastProcessedAt).toBe('2026-06-18');
    expect(result.goals[0].fundingRules[0].nextRunDate).toBe('2026-07-15');
  });

  test('one-time rule moves money once and is removed', () => {
    const goals = [{
      id: 'g1',
      type: 'custom',
      lifecycleStatus: 'active',
      currentAmount: 0,
      fundingRules: [{
        id: 'r1',
        stashRef: 'looseCash',
        amount: 150,
        frequency: 'once',
        priority: 0,
        nextRunDate: '2026-06-18',
        lastProcessedAt: null,
      }],
    }];
    const budget = { looseMoneyBalance: 500 };
    const now = new Date('2026-06-18');

    const result = processGoalFundingIfDue(goals, budget, {}, [], now);

    expect(result.goals[0].currentAmount).toBe(150);
    expect(result.budget.looseMoneyBalance).toBe(350);
    expect(result.goals[0].fundingRules).toHaveLength(0);
  });

  test('recurring funding stops at target amount', () => {
    const goals = [{
      id: 'g1',
      type: 'custom',
      lifecycleStatus: 'active',
      targetAmount: 1000,
      currentAmount: 950,
      fundingRules: [{
        id: 'r1',
        stashRef: 'looseCash',
        amount: 200,
        frequency: 'monthly',
        priority: 0,
        nextRunDate: '2026-06-15',
        dayOfMonth: 15,
        lastProcessedAt: null,
      }],
    }];
    const budget = { looseMoneyBalance: 500 };
    const now = new Date('2026-06-18');

    const result = processGoalFundingIfDue(goals, budget, {}, [], now);

    expect(result.goals[0].currentAmount).toBe(1000);
    expect(result.budget.looseMoneyBalance).toBe(450);
    expect(result.goals[0].fundingRules[0].lastProcessedAt).toBe('2026-06-18');
  });
});
