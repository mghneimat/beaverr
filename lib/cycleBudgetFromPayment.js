import { splitFlexibleBudget } from './budgetSplit';
import {
  availableBudget,
  effectiveSpendingBudget,
  roundMoney,
  sumCommittedLoad,
} from './finance';

/**
 * Derive cycle spending budget and planned savings from a received payment,
 * using the same split and savings-goal rules as the Budget tab.
 *
 * @param {{
 *   paymentAmount: number,
 *   totalIncome: number,
 *   fixedCosts?: number,
 *   debtPayments?: number,
 *   budgetSpendingRatio?: number,
 *   deductSavingsGoal?: boolean,
 *   savingsGoalDeduction?: number,
 * }} params
 * @returns {{ cycleBudget: number, plannedSavingsAmount: number, flexibleFromPayment: number }}
 */
export function computeCycleBudgetFromPayment({
  paymentAmount,
  totalIncome,
  fixedCosts = 0,
  debtPayments = 0,
  budgetSpendingRatio,
  deductSavingsGoal = false,
  savingsGoalDeduction = 0,
}) {
  const payment = Math.max(0, roundMoney(Number(paymentAmount) || 0));
  if (payment <= 0) {
    return { cycleBudget: 0, plannedSavingsAmount: 0, flexibleFromPayment: 0 };
  }

  const income = Math.max(0, Number(totalIncome) || 0);
  const committed = sumCommittedLoad(fixedCosts, debtPayments);
  const monthlyAvail = availableBudget(income, fixedCosts, debtPayments);

  let flexFromPayment;
  if (income > 0) {
    const paymentShare = payment / income;
    flexFromPayment = Math.max(0, roundMoney(payment - committed * paymentShare));
  } else {
    flexFromPayment = payment;
  }

  const { spendingMonthly, savingsShift } = splitFlexibleBudget(
    flexFromPayment,
    budgetSpendingRatio,
  );

  const goalDeduction = income > 0 && monthlyAvail > 0
    ? (Number(savingsGoalDeduction) || 0) * (flexFromPayment / monthlyAvail)
    : (Number(savingsGoalDeduction) || 0);

  const cycleBudget = roundMoney(Math.max(
    0,
    effectiveSpendingBudget(spendingMonthly, goalDeduction, deductSavingsGoal),
  ));

  return {
    cycleBudget,
    plannedSavingsAmount: roundMoney(Math.max(0, savingsShift)),
    flexibleFromPayment: flexFromPayment,
  };
}
