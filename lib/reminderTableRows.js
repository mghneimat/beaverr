import {
  buildFixedExpensePanels,
  buildRecurringExpensePanels,
  FIXED_EXPENSE_TAB_KEYS,
} from './expensePanels';
import { formatExpenseEndDateCell, formatExpenseNextPaymentCell, isExpenseNoDateCell } from './expenseTableCells';
import { buildReminderRows, sortReminderRows } from './reminderSchedule';

/**
 * @typedef {import('./reminderSchedule').ReminderRow & {
 *   iconSectionKey: string,
 *   cells: { name: string, endDate: string, nextPayment: string },
 * }} ReminderTableRow
 */

/**
 * @param {import('./expensePanels').ExpensePanel} panel
 * @param {import('./expensePanels').ExpenseLineItem} item
 * @param {(key: string, params?: object) => string} t
 * @returns {ReminderTableRow}
 */
function expenseLineToTableRow(panel, item, t) {
  const meta = {
    endDate: item.endDate || null,
    renewalDate: item.renewalDate || null,
    dueDate: item.dueDate || null,
    chargeDay: item.chargeDay || null,
    nextPaymentOverride: item.nextPaymentOverride || null,
    frequency: item.frequency,
  };

  const endDateCell = formatExpenseEndDateCell(meta, t);
  const nextPaymentCell = formatExpenseNextPaymentCell(meta, t);
  const hasNextPayment = !isExpenseNoDateCell(nextPaymentCell, t);

  return {
    id: item.id,
    reminderId: item.id,
    name: item.subcategory,
    categoryKey: panel.key,
    sectionId: item.sectionId || panel.sectionId,
    dateType: item.dateType || null,
    dateValue: hasNextPayment ? nextPaymentCell : null,
    hasNextPayment,
    editKind: item.editKind,
    editRef: item.editRef ?? null,
    actionRoute: '/(app)/costs',
    iconSectionKey: panel.key,
    cells: {
      name: item.subcategory,
      endDate: endDateCell,
      nextPayment: nextPaymentCell,
    },
  };
}

/**
 * @param {import('./reminderSchedule').ReminderRow} item
 * @param {(key: string, params?: object) => string} t
 * @returns {ReminderTableRow}
 */
function scheduleExtraToTableRow(item, t) {
  const noDate = t('dashboard.expensesScreen.noDate');
  let endDate = noDate;
  let nextPayment = noDate;

  if (item.dateType === 'end' && item.dateValue) {
    endDate = item.dateValue;
  } else if ((item.dateType === 'due' || item.dateType === 'renewal') && item.dateValue) {
    nextPayment = item.dateValue;
  } else if (item.dateValue) {
    endDate = item.dateValue;
  }

  const hasNextPayment = !isExpenseNoDateCell(nextPayment, t);

  return {
    ...item,
    iconSectionKey: item.categoryKey,
    dateValue: hasNextPayment ? nextPayment : null,
    hasNextPayment,
    cells: {
      name: item.name,
      endDate,
      nextPayment,
    },
  };
}

/**
 * All household expenses with end-date and next-payment columns for the Reminders tab.
 * @param {import('./householdBudget').RawSections} sections
 * @param {object[]} debts
 * @param {object|null} household
 * @param {(key: string, params?: object) => string} t
 * @returns {ReminderTableRow[]}
 */
export function buildReminderTableRows(sections, debts, household, t) {
  const fixed = buildFixedExpensePanels(sections, household, t);
  const recurring = buildRecurringExpensePanels(sections, debts, household, t);
  /** @type {ReminderTableRow[]} */
  const rows = [];

  [...fixed, ...recurring].forEach((panel) => {
    panel.lineItems.forEach((item) => {
      rows.push(expenseLineToTableRow(panel, item, t));
    });
  });

  const expenseIds = new Set(rows.map((row) => row.id));
  buildReminderRows(sections, debts, household, t).forEach((item) => {
    if (expenseIds.has(item.id)) return;
    rows.push(scheduleExtraToTableRow(item, t));
  });

  return sortReminderRows(rows);
}

/**
 * Deep link to edit an expense row on the Costs tab (primary/sub/editRow params).
 * @param {ReminderTableRow} row
 * @returns {{ pathname: string, params?: Record<string, string> }}
 */
export function buildReminderExpenseEditRoute(row) {
  const categoryKey = row.iconSectionKey || row.categoryKey || 'other';
  const pathname = row.actionRoute || '/(app)/costs';

  if (pathname !== '/(app)/costs') {
    return { pathname };
  }

  const primaryTab = FIXED_EXPENSE_TAB_KEYS.includes(categoryKey) ? 'fixed' : 'recurring';
  return {
    pathname,
    params: {
      primary: primaryTab,
      sub: categoryKey,
      ...(row.id ? { editRow: row.id } : {}),
    },
  };
}
