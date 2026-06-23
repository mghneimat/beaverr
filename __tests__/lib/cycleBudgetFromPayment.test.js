import { computeCycleBudgetFromPayment } from '../../lib/cycleBudgetFromPayment';

describe('computeCycleBudgetFromPayment', () => {
  const base = {
    totalIncome: 50_000,
    fixedCosts: 20_000,
    debtPayments: 5_000,
    budgetSpendingRatio: 0.6,
    deductSavingsGoal: false,
    savingsGoalDeduction: 0,
  };

  it('maps full monthly payment to budget-tab spending share', () => {
    const result = computeCycleBudgetFromPayment({
      ...base,
      paymentAmount: 50_000,
    });
    expect(result.cycleBudget).toBe(15_000);
    expect(result.plannedSavingsAmount).toBe(10_000);
    expect(result.flexibleFromPayment).toBe(25_000);
  });

  it('scales proportionally for partial payments', () => {
    const result = computeCycleBudgetFromPayment({
      ...base,
      paymentAmount: 25_000,
    });
    expect(result.cycleBudget).toBe(7_500);
    expect(result.plannedSavingsAmount).toBe(5_000);
  });

  it('deducts savings goal reservation when enabled', () => {
    const result = computeCycleBudgetFromPayment({
      ...base,
      paymentAmount: 50_000,
      deductSavingsGoal: true,
      savingsGoalDeduction: 3_000,
    });
    expect(result.cycleBudget).toBe(12_000);
  });

  it('returns zero budget for non-positive payment', () => {
    expect(computeCycleBudgetFromPayment({ ...base, paymentAmount: 0 }).cycleBudget).toBe(0);
  });
});
