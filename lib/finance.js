/**
 * Financial calculation utilities
 * All functions preserve original amount + frequency
 */

/**
 * Parse user-entered money strings (e.g. "1 500,00") into a number.
 * @param {string|number|null|undefined} value
 * @returns {number|null}
 */
export function parseMoneyAmount(value) {
  if (value === '' || value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
  }
  const n = parseFloat(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/**
 * Convert any frequency to monthly equivalent
 * @param {number|string} amount - Original amount
 * @param {string} frequency - 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annual'
 * @returns {number} Monthly equivalent
 */
export function toMonthly(amount, frequency) {
  const numAmount = typeof amount === 'number' ? amount : (parseMoneyAmount(amount) ?? 0);
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

/** Average weeks per month — matches toMonthly weekly multiplier */
const WEEKS_PER_MONTH = 4.33;

/**
 * Calculate weekly spending allowance from a monthly budget
 * @param {number} monthlyBudget - Total monthly flexible budget
 * @returns {number} Weekly allowance
 */
export function weeklyAllowance(monthlyBudget) {
  if (!monthlyBudget || monthlyBudget <= 0) return 0;
  return monthlyBudget / WEEKS_PER_MONTH;
}

/**
 * Convert monthly flexible budget to the user's preferred display frequency
 * @param {number} monthlyBudget - Total monthly flexible budget
 * @param {'daily' | 'weekly' | 'monthly'} [frequency='daily'] - Display frequency
 * @param {number} [daysInMonth=30] - Days in current month (for daily)
 * @returns {number} Budget amount in the chosen frequency
 */
export function displayBudget(monthlyBudget, frequency = 'daily', daysInMonth = 30) {
  const monthly = Number(monthlyBudget);
  if (!monthly || monthly <= 0) return 0;

  switch (frequency?.toLowerCase()) {
    case 'weekly':
      return weeklyAllowance(monthly);
    case 'monthly':
      return monthly;
    case 'daily':
    default:
      return dailyAllowance(monthly, daysInMonth);
  }
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
    totalInterest: roundMoney(totalInterest),
    payoffDate,
  };
}

/**
 * Round to 2 decimal places (haléře).
 * @param {number} amount
 * @returns {number}
 */
export function roundMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * Divide money without rounding — use roundMoney only at storage/display boundaries.
 * @param {number} numerator
 * @param {number} divisor
 * @returns {number}
 */
export function divideMoney(numerator, divisor) {
  const n = Number(numerator) || 0;
  const d = Number(divisor) || 0;
  if (d <= 0) return 0;
  return n / d;
}

/**
 * Live input filter — digits with optional comma/dot and max 2 fractional digits.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeAmountInput(text) {
  const raw = String(text ?? '').replace(/\s/g, '');
  if (!raw) return '';

  const normalized = raw.replace(',', '.');
  const parts = normalized.split('.');
  const intPart = parts[0].replace(/[^\d]/g, '');
  if (parts.length === 1) {
    return intPart;
  }

  const fracPart = parts.slice(1).join('').replace(/[^\d]/g, '').slice(0, 2);
  if (!intPart && !fracPart) return '';
  if (!fracPart) {
    return raw.includes(',') || raw.includes('.') ? `${intPart},` : intPart;
  }
  return `${intPart},${fracPart}`;
}

/**
 * Format amount for input display (no currency symbol).
 * @param {number} amount
 * @returns {string}
 */
export function formatAmountInput(amount) {
  const rounded = roundMoney(amount);
  const [intPart, decPart] = rounded.toFixed(2).split('.');
  return `${intPart},${decPart}`;
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} [currency='Kč'] - Currency symbol
 * @returns {string} Formatted string (e.g., "12 500,00 Kč")
 */
export function formatCurrency(amount, currency = 'Kč') {
  if (amount === null || amount === undefined || amount === '') return '—';

  const numeric = typeof amount === 'number'
    ? (Number.isFinite(amount) ? amount : null)
    : parseMoneyAmount(amount);
  if (numeric == null) return '—';

  const rounded = roundMoney(numeric);
  const [intPart, decPart] = rounded.toFixed(2).split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const formatted = `${formattedInt},${decPart}`;
  if (!currency) return formatted;
  return `${formatted} ${currency}`;
}

/**
 * Format currency with optional leading plus for positive amounts.
 * @param {number|null|undefined} amount
 * @param {string} [currency='Kč']
 * @param {boolean} [showPlus=false]
 */
export function formatSignedCurrency(amount, currency = 'Kč', showPlus = false) {
  const formatted = formatCurrency(amount, currency);
  if (showPlus && typeof amount === 'number' && amount > 0) {
    return `+${formatted}`;
  }
  return formatted;
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

/**
 * Fixed household costs plus minimum debt payments (canonical "committed load").
 * @param {{ fixedCosts?: number, debtPayments?: number }} financials
 * @returns {number}
 */
export function committedMonthlyLoad(financials) {
  return sumCommittedLoad(financials?.fixedCosts, financials?.debtPayments);
}

/**
 * @param {number} fixedCosts
 * @param {number} debtPayments
 * @returns {number}
 */
export function sumCommittedLoad(fixedCosts, debtPayments) {
  return (Number(fixedCosts) || 0) + (Number(debtPayments) || 0);
}

/**
 * Spending budget after optional savings-goal reservation.
 * @param {number} monthlyFlexible - Base flexible budget (before goal deduction)
 * @param {number} monthlySavingsRequired - Monthly amount needed to reach savings goal
 * @param {boolean} deductSavingsGoal - When true, subtract savings from spending budget
 * @returns {number}
 */
export function effectiveSpendingBudget(monthlyFlexible, monthlySavingsRequired, deductSavingsGoal) {
  const base = Number(monthlyFlexible) || 0;
  if (!deductSavingsGoal) return base;
  const deduction = Number(monthlySavingsRequired) || 0;
  return Math.max(0, base - deduction);
}
