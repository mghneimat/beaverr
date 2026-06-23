import { displayBudget, formatCurrency } from '../../lib/finance';

/** Resolve monthly amount at the user's chosen dashboard frequency. */
export function resolveDashboardAmount(monthlyAmount, frequency, daysInMonth) {
  return displayBudget(monthlyAmount, frequency, daysInMonth);
}

/** Format a monthly amount at the user's chosen dashboard frequency. */
export function formatDashboardAmount(monthlyAmount, frequency, currency, daysInMonth) {
  return formatCurrency(resolveDashboardAmount(monthlyAmount, frequency, daysInMonth), currency);
}
