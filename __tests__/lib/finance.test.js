/**
 * Tests for finance utilities
 */

import {
  toMonthly,
  dailyAllowance,
  weeklyAllowance,
  displayBudget,
  debtPayoff,
  formatCurrency,
  roundMoney,
  divideMoney,
  sanitizeAmountInput,
  formatAmountInput,
  totalMonthlyCosts,
  availableBudget,
  effectiveSpendingBudget,
  committedMonthlyLoad,
  sumCommittedLoad,
} from '../../lib/finance';

describe('toMonthly', () => {
  test('converts daily to monthly', () => {
    expect(toMonthly(100, 'daily')).toBeCloseTo(3044, 0);
  });

  test('converts weekly to monthly', () => {
    expect(toMonthly(100, 'weekly')).toBeCloseTo(433, 0);
  });

  test('converts fortnightly to monthly', () => {
    expect(toMonthly(100, 'fortnightly')).toBeCloseTo(217, 0);
  });

  test('returns same amount for monthly', () => {
    expect(toMonthly(100, 'monthly')).toBe(100);
  });

  test('converts quarterly to monthly', () => {
    expect(toMonthly(300, 'quarterly')).toBeCloseTo(100, 0);
  });

  test('converts annual to monthly', () => {
    expect(toMonthly(1200, 'annual')).toBe(100);
  });

  test('returns 0 for zero amount', () => {
    expect(toMonthly(0, 'monthly')).toBe(0);
  });

  test('returns 0 for negative amount', () => {
    expect(toMonthly(-100, 'monthly')).toBe(0);
  });

  test('handles unknown frequency by defaulting to monthly', () => {
    expect(toMonthly(100, 'unknown')).toBe(100);
  });

  test('parses Czech-formatted amount strings', () => {
    expect(toMonthly('1 500,00', 'monthly')).toBe(1500);
    expect(toMonthly('500,00', 'monthly')).toBe(500);
  });
});

describe('dailyAllowance', () => {
  test('calculates daily allowance correctly', () => {
    expect(dailyAllowance(3000, 30)).toBe(100);
  });

  test('handles different days in month', () => {
    expect(dailyAllowance(3100, 31)).toBe(100);
  });

  test('returns 0 for zero budget', () => {
    expect(dailyAllowance(0, 30)).toBe(0);
  });

  test('returns 0 for negative budget', () => {
    expect(dailyAllowance(-1000, 30)).toBe(0);
  });
});

describe('weeklyAllowance', () => {
  test('calculates weekly allowance from monthly budget', () => {
    expect(weeklyAllowance(433)).toBeCloseTo(100, 0);
  });

  test('returns 0 for zero budget', () => {
    expect(weeklyAllowance(0)).toBe(0);
  });

  test('returns 0 for negative budget', () => {
    expect(weeklyAllowance(-1000)).toBe(0);
  });
});

describe('displayBudget', () => {
  test('returns daily amount by default', () => {
    expect(displayBudget(3000, 'daily', 30)).toBe(100);
  });

  test('returns weekly amount', () => {
    expect(displayBudget(433, 'weekly')).toBeCloseTo(100, 0);
  });

  test('returns monthly amount unchanged', () => {
    expect(displayBudget(15000, 'monthly')).toBe(15000);
  });

  test('defaults to daily for unknown frequency', () => {
    expect(displayBudget(3000, 'unknown', 30)).toBe(100);
  });

  test('returns 0 for zero monthly budget', () => {
    expect(displayBudget(0, 'weekly')).toBe(0);
  });
});

describe('debtPayoff', () => {
  test('calculates interest-free debt payoff', () => {
    const result = debtPayoff(1000, 100, 0);
    expect(result.months).toBe(10);
    expect(result.totalInterest).toBe(0);
    expect(result.payoffDate).toBeInstanceOf(Date);
  });

  test('calculates debt with interest', () => {
    const result = debtPayoff(1000, 100, 12);
    expect(result.months).toBeGreaterThan(10);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  test('returns infinity when payment does not cover interest', () => {
    const result = debtPayoff(10000, 10, 20);
    expect(result.months).toBe(Infinity);
    expect(result.totalInterest).toBe(Infinity);
    expect(result.payoffDate).toBeNull();
  });

  test('returns 0 months for zero balance', () => {
    const result = debtPayoff(0, 100, 10);
    expect(result.months).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  test('returns infinity for zero payment', () => {
    const result = debtPayoff(1000, 0, 10);
    expect(result.months).toBe(Infinity);
  });
});

describe('formatCurrency', () => {
  test('formats amount with space separator and always 2dp', () => {
    expect(formatCurrency(12500)).toBe('12 500,00 Kč');
  });

  test('formats small amounts', () => {
    expect(formatCurrency(100)).toBe('100,00 Kč');
  });

  test('formats large amounts', () => {
    expect(formatCurrency(1234567)).toBe('1 234 567,00 Kč');
  });

  test('shows two decimal places for fractional amounts', () => {
    expect(formatCurrency(123.45)).toBe('123,45 Kč');
    expect(formatCurrency(123.67)).toBe('123,67 Kč');
    expect(formatCurrency(100.1)).toBe('100,10 Kč');
  });

  test('handles custom currency', () => {
    expect(formatCurrency(1000, '€')).toBe('1 000,00 €');
  });

  test('omits currency symbol when empty string', () => {
    expect(formatCurrency(1000, '')).toBe('1 000,00');
  });

  test('returns em dash for null', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  test('returns em dash for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—');
  });

  test('parses Czech-formatted amount strings', () => {
    expect(formatCurrency('800,00', 'CZK')).toBe('800,00 CZK');
    expect(formatCurrency('1 200,50', 'CZK')).toBe('1 200,50 CZK');
    expect(formatCurrency('10 000,00', 'CZK')).toBe('10 000,00 CZK');
  });
});

describe('roundMoney', () => {
  test('rounds to two decimal places', () => {
    expect(roundMoney(123.456)).toBe(123.46);
    expect(roundMoney(123.454)).toBe(123.45);
  });
});

describe('divideMoney', () => {
  test('divides without rounding', () => {
    expect(divideMoney(15000, 31)).toBeCloseTo(483.8709677419355, 10);
  });

  test('returns 0 for zero divisor', () => {
    expect(divideMoney(100, 0)).toBe(0);
  });
});

describe('sanitizeAmountInput', () => {
  test('allows digits and comma decimal', () => {
    expect(sanitizeAmountInput('123,45')).toBe('123,45');
    expect(sanitizeAmountInput('123.45')).toBe('123,45');
  });

  test('limits fractional digits to two', () => {
    expect(sanitizeAmountInput('1,234')).toBe('1,23');
  });

  test('strips spaces and non-numeric chars', () => {
    expect(sanitizeAmountInput('1 234,5')).toBe('1234,5');
  });
});

describe('formatAmountInput', () => {
  test('formats without currency symbol', () => {
    expect(formatAmountInput(200)).toBe('200,00');
    expect(formatAmountInput(123.4)).toBe('123,40');
  });
});

describe('totalMonthlyCosts', () => {
  test('calculates total from multiple costs', () => {
    const costs = [
      { amount: 1000, frequency: 'monthly' },
      { amount: 100, frequency: 'weekly' },
      { amount: 1200, frequency: 'annual' },
    ];
    const total = totalMonthlyCosts(costs);
    expect(total).toBeCloseTo(1533, 0);
  });

  test('returns 0 for empty array', () => {
    expect(totalMonthlyCosts([])).toBe(0);
  });

  test('returns 0 for non-array input', () => {
    expect(totalMonthlyCosts(null)).toBe(0);
  });
});

describe('availableBudget', () => {
  test('calculates available budget correctly', () => {
    const result = availableBudget(5000, 3000, 500);
    expect(result).toBe(1500);
  });

  test('handles zero costs', () => {
    const result = availableBudget(5000, 0, 0);
    expect(result).toBe(5000);
  });

  test('can return negative budget', () => {
    const result = availableBudget(3000, 2500, 1000);
    expect(result).toBe(-500);
  });
});

describe('effectiveSpendingBudget', () => {
  test('returns base when deduction disabled', () => {
    expect(effectiveSpendingBudget(10000, 3000, false)).toBe(10000);
  });

  test('subtracts savings goal when deduction enabled', () => {
    expect(effectiveSpendingBudget(10000, 3000, true)).toBe(7000);
  });

  test('does not go below zero', () => {
    expect(effectiveSpendingBudget(2000, 5000, true)).toBe(0);
  });
});

describe('committedMonthlyLoad', () => {
  test('sums fixed costs and debt payments from financials', () => {
    expect(committedMonthlyLoad({ fixedCosts: 12000, debtPayments: 3500 })).toBe(15500);
  });

  test('sumCommittedLoad handles missing values', () => {
    expect(sumCommittedLoad(undefined, null)).toBe(0);
    expect(sumCommittedLoad(100, 50)).toBe(150);
  });
});
