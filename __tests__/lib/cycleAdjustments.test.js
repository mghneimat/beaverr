import {
  sumPoolAdjustments,
  activeCycleAdjustments,
  pendingNextCycleAdjustments,
  sumNextCycleAdjustments,
  dueAdjustmentsToday,
  isAdjustmentAppliedToPool,
  adjustmentAffectsPool,
} from '../../lib/cycleAdjustments';

describe('cycleAdjustments', () => {
  const cycleId = 'c1';

  const rows = [
    {
      id: 'a1',
      cycleId: 'c1',
      kind: 'expense',
      amount: 3000,
      label: 'Brakes',
      timing: 'immediate',
      paymentDate: '2026-06-01',
      funding: 'cycleBudget',
      status: 'active',
      createdAt: '2026-06-01T00:00:00.000Z',
    },
    {
      id: 'a2',
      cycleId: 'c1',
      kind: 'income',
      amount: 1000,
      label: 'Bonus',
      timing: 'immediate',
      paymentDate: '2026-06-02',
      funding: 'cycleBudget',
      status: 'active',
      createdAt: '2026-06-02T00:00:00.000Z',
    },
    {
      id: 'a3',
      cycleId: 'c1',
      kind: 'expense',
      amount: 500,
      label: 'Elsewhere',
      timing: 'immediate',
      paymentDate: '2026-06-02',
      funding: 'elsewhere',
      status: 'active',
      createdAt: '2026-06-02T00:00:00.000Z',
    },
    {
      id: 'a4',
      cycleId: 'c1',
      kind: 'expense',
      amount: 800,
      label: 'Future repair',
      timing: 'scheduled',
      paymentDate: '2026-06-20',
      funding: 'cycleBudget',
      status: 'active',
      createdAt: '2026-06-01T00:00:00.000Z',
    },
    {
      id: 'a5',
      cycleId: 'c1',
      kind: 'income',
      amount: 2000,
      label: 'Next paycheck bonus',
      timing: 'next_cycle',
      paymentDate: null,
      funding: 'cycleBudget',
      status: 'active',
      createdAt: '2026-06-01T00:00:00.000Z',
    },
    {
      id: 'a6',
      cycleId: 'c1',
      kind: 'expense',
      amount: 500,
      label: 'Cancelled',
      timing: 'immediate',
      status: 'cancelled',
      createdAt: '2026-06-02T00:00:00.000Z',
    },
  ];

  test('sumPoolAdjustments nets applied rows on date; ignores elsewhere and future', () => {
    expect(sumPoolAdjustments(rows, cycleId, '2026-06-05')).toEqual({
      income: 1000,
      expense: 3000,
    });
  });

  test('sumPoolAdjustments includes scheduled when date reached', () => {
    expect(sumPoolAdjustments(rows, cycleId, '2026-06-20')).toEqual({
      income: 1000,
      expense: 3800,
    });
  });

  test('activeCycleAdjustments ignores cancelled', () => {
    expect(activeCycleAdjustments(rows, cycleId)).toHaveLength(5);
  });

  test('pendingNextCycleAdjustments lists deferrals only', () => {
    expect(pendingNextCycleAdjustments(rows, cycleId)).toHaveLength(1);
    expect(sumNextCycleAdjustments(rows, cycleId)).toEqual({ income: 2000, expense: 0 });
  });

  test('dueAdjustmentsToday matches payment date', () => {
    expect(dueAdjustmentsToday(rows, cycleId, '2026-06-02')).toHaveLength(2);
  });

  test('isAdjustmentAppliedToPool excludes next_cycle', () => {
    expect(isAdjustmentAppliedToPool(rows[4], '2026-06-30')).toBe(false);
  });

  test('adjustmentAffectsPool false for elsewhere expense', () => {
    expect(adjustmentAffectsPool(rows[2])).toBe(false);
  });
});
