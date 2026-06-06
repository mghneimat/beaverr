/**
 * Financial calculation utilities
 * All functions preserve original amount + frequency
 */

/**
 * Convert any frequency to monthly equivalent
 * @param {number} amount - Original amount
 * @param {string} frequency - 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annual'
 * @returns {number} Monthly equivalent
 */
export function toMonthly(amount, frequency) {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) return 0;
  
  const multipliers = {
    daily: 30.44, // Average days per month
    weekly: 4.33, // Average weeks per month
    fortnightly: 2.17, // Average fortnights per month
    monthly: 1,
    quarterly: 1 / 3,
    annual: 1 / 12,
  };
  
  const multiplier = multipliers[frequency?.toLowerCase()];
  if (multiplier === undefined) {
    console.warn(`Unknown frequency: ${frequency}, defaulting to monthly`);
    return numAmount;
  }
  
  return numAmount * multiplier;
}

/**
 * Calculate daily spending allowance
 * @param {number} monthlyBudget - Total monthly flexible budget
 * @param {number} [daysInMonth=30] - Days in current month
 * @returns {number} Daily allowance
 */
export function dailyAllowance(monthlyBudget, daysInMonth = 30) {
  if (!monthlyBudget || monthlyBudget <= 0) return 0;
  return monthlyBudget / daysInMonth;
}

/**
 * Calculate debt payoff timeline
 * @param {number} balance - Current debt balance
 * @param {number} monthlyPayment - Monthly payment amount
 * @param {number} apr - Annual percentage rate (e.g., 19.9 for 19.9%)
 * @returns {{ months: number, totalInterest: number, payoffDate: Date }} Payoff details
 */
export function debtPayoff(balance, monthlyPayment, apr) {
  if (!balance || balance <= 0) {
    return { months: 0, totalInterest: 0, payoffDate: new Date() };
  }
  
  if (!monthlyPayment || monthlyPayment <= 0) {
    return { months: Infinity, totalInterest: Infinity, payoffDate: null };
  }
  
  // Interest-free debt
  if (!apr || apr <= 0) {
    const months = Math.ceil(balance / monthlyPayment);
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);
    return { months, totalInterest: 0, payoffDate };
  }
  
  // Calculate with interest
  const monthlyRate = apr / 100 / 12;
  let remainingBalance = balance;
  let months = 0;
  let totalInterest = 0;
  const maxMonths = 600; // 50 years safety limit
  
  while (remainingBalance > 0 && months < maxMonths) {
    const interestCharge = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestCharge;
    
    // Payment doesn't cover interest - debt will never be paid off
    if (principalPayment <= 0) {
      return { months: Infinity, totalInterest: Infinity, payoffDate: null };
    }
    
    totalInterest += interestCharge;
    remainingBalance -= principalPayment;
    months++;
  }
  
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + months);
  
  return {
    months,
    totalInterest: Math.round(totalInterest),
    payoffDate,
  };
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} [currency='Kč'] - Currency symbol
 * @returns {string} Formatted string (e.g., "12 500 Kč")
 */
export function formatCurrency(amount, currency = 'Kč') {
  if (amount === null || amount === undefined) return '—';
  
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ${currency}`;
}

/**
 * Calculate total monthly costs from cost array
 * @param {Array<{amount: number, frequency: string}>} costs - Array of cost items
 * @returns {number} Total monthly cost
 */
export function totalMonthlyCosts(costs) {
  if (!Array.isArray(costs) || costs.length === 0) return 0;
  
  return costs.reduce((total, cost) => {
    return total + toMonthly(cost.amount, cost.frequency);
  }, 0);
}

/**
 * Calculate available budget after fixed costs
 * @param {number} monthlyIncome - Total monthly income
 * @param {number} fixedCosts - Total monthly fixed costs
 * @param {number} debtPayments - Total monthly debt payments
 * @returns {number} Available for flexible spending
 */
export function availableBudget(monthlyIncome, fixedCosts, debtPayments) {
  return monthlyIncome - fixedCosts - debtPayments;
}
