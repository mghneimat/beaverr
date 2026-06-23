import { computeNextPaymentDate } from './nextPaymentDate';

/**
 * @param {{ endDate?: string|null, renewalDate?: string|null }} row
 * @param {(key: string) => string} t
 */
export function formatExpenseEndDateCell(row, t) {
  const date = row.endDate || row.renewalDate;
  if (date) return date;
  return t('dashboard.expensesScreen.noDate');
}

/**
 * @param {{ nextPaymentOverride?: string|null, dueDate?: string|null, chargeDay?: string|number|null, frequency?: string, endDate?: string|null, renewalDate?: string|null }} row
 * @param {(key: string) => string} t
 */
export function formatExpenseNextPaymentCell(row, t) {
  if (row.nextPaymentOverride) return row.nextPaymentOverride;
  if (row.dueDate) return row.dueDate;
  const computed = computeNextPaymentDate({
    chargeDay: row.chargeDay,
    frequency: row.frequency,
  });
  if (computed) return computed;
  return t('dashboard.expensesScreen.noDate');
}

/**
 * @param {string|null|undefined} cellValue
 * @param {(key: string) => string} t
 */
export function isExpenseNoDateCell(cellValue, t) {
  return !cellValue || cellValue === t('dashboard.expensesScreen.noDate');
}
