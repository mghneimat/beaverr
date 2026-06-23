import {
  clampBudgetSpendingRatio,
  splitFlexibleBudget,
  splitFromSpendingAmount,
  resolveBudgetSpendingRatio,
  snapSpendingMonthly,
} from '../../lib/budgetSplit';

describe('splitFlexibleBudget', () => {
  it('keeps full amount for spending at ratio 1', () => {
    expect(splitFlexibleBudget(10000, 1)).toEqual({
      spendingMonthly: 10000,
      savingsShift: 0,
      ratio: 1,
    });
  });

  it('shifts remainder to savings when ratio is reduced', () => {
    expect(splitFlexibleBudget(10000, 0.8)).toEqual({
      spendingMonthly: 8000,
      savingsShift: 2000,
      ratio: 0.8,
    });
  });

  it('rounds spending to 2 decimal places', () => {
    expect(splitFlexibleBudget(10300, 0.79)).toEqual({
      spendingMonthly: 8137,
      savingsShift: 2163,
      ratio: 8137 / 10300,
    });
  });
});

describe('snapSpendingMonthly', () => {
  it('rounds to 2 decimal places within available budget', () => {
    expect(snapSpendingMonthly(10000, 8240.4)).toBe(8240.4);
    expect(snapSpendingMonthly(10000, 8240.6)).toBe(8240.6);
  });

  it('clamps to available budget', () => {
    expect(snapSpendingMonthly(10300, 10400)).toBe(10300);
    expect(snapSpendingMonthly(10300, -50)).toBe(0);
  });
});

describe('splitFromSpendingAmount', () => {
  it('derives savings and ratio from a spending amount', () => {
    expect(splitFromSpendingAmount(10300, 8137)).toEqual({
      spendingMonthly: 8137,
      savingsShift: 2163,
      ratio: 8137 / 10300,
    });
  });

  it('clamps spending to available budget', () => {
    expect(splitFromSpendingAmount(5000, 6200)).toEqual({
      spendingMonthly: 5000,
      savingsShift: 0,
      ratio: 1,
    });
  });
});

describe('resolveBudgetSpendingRatio', () => {
  it('prefers explicit ratio when stored', () => {
    expect(resolveBudgetSpendingRatio({ budgetSpendingRatio: 0.75 }, 10000)).toBe(0.75);
  });

  it('infers ratio from legacy monthlyFlexible', () => {
    expect(resolveBudgetSpendingRatio({ monthlyFlexible: 6000 }, 10000)).toBe(0.6);
  });
});

describe('clampBudgetSpendingRatio', () => {
  it('clamps out-of-range values', () => {
    expect(clampBudgetSpendingRatio(1.5)).toBe(1);
    expect(clampBudgetSpendingRatio(-0.2)).toBe(0);
  });
});
