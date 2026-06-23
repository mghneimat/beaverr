import {
  buildFixedExpensePanels,
  buildRecurringExpensePanels,
} from './expensePanels';
import { parseAlertDate, daysUntil } from './alertDates';

/**
 * @typedef {'renewal'|'due'|'end'} ReminderDateType
 */

/**
 * @typedef {Object} ReminderRow
 * @property {string} id
 * @property {string} reminderId
 * @property {string} name
 * @property {string} categoryKey
 * @property {string} sectionId
 * @property {ReminderDateType} dateType
 * @property {string|null} dateValue
 * @property {string} [editKind]
 * @property {object|null} [editRef]
 * @property {string} [actionRoute]
 */

/**
 * Resolve the stored date string for a reminder row.
 * @param {ReminderRow} row
 * @returns {string|null}
 */
export function resolveReminderDateValue(row) {
  if (!row?.dateValue) return null;
  return row.dateValue;
}

/**
 * @param {ReminderRow} row
 * @param {Date} [from]
 * @returns {number|null} Days until date, negative if overdue, null if no date
 */
export function reminderDaysUntil(row, from = new Date()) {
  const parsed = parseAlertDate(resolveReminderDateValue(row));
  if (!parsed) return null;
  return daysUntil(parsed, from);
}

/**
 * @param {import('./householdBudget').RawSections} sections
 * @param {object[]} debts
 * @param {object|null} household
 * @param {(key: string, params?: object) => string} t
 * @returns {ReminderRow[]}
 */
export function buildReminderRows(sections, debts, household, t) {
  const fixed = buildFixedExpensePanels(sections, household, t);
  const recurring = buildRecurringExpensePanels(sections, debts, household, t);
  /** @type {ReminderRow[]} */
  const rows = [];

  [...fixed, ...recurring].forEach((panel) => {
    panel.lineItems.forEach((item) => {
      if (!item.dateType) return;
      const dateValue = item.endDate || item.dueDate || item.renewalDate || null;
      rows.push({
        id: item.id,
        reminderId: item.id,
        name: item.subcategory,
        categoryKey: panel.key,
        sectionId: item.sectionId || panel.sectionId,
        dateType: item.dateType,
        dateValue,
        editKind: item.editKind,
        editRef: item.editRef ?? null,
        actionRoute: '/(app)/costs',
      });
    });
  });

  const transport = sections?.transport || {};
  if (transport.hasVehicle && Array.isArray(transport.vehicles)) {
    transport.vehicles.forEach((vehicle, vi) => {
      rows.push({
        id: `mot-${vi}`,
        reminderId: `mot-${vi}`,
        name: transport.vehicles.length > 1
          ? t('dashboard.remindersScreen.motVehicle', { n: vi + 1 })
          : t('dashboard.remindersScreen.mot'),
        categoryKey: 'transport',
        sectionId: 'transport',
        dateType: 'due',
        dateValue: vehicle.motDate || null,
        actionRoute: '/(app)/costs',
      });
      if (vehicle.motNextDate) {
        rows.push({
          id: `mot-next-${vi}`,
          reminderId: `mot-next-${vi}`,
          name: transport.vehicles.length > 1
            ? t('dashboard.remindersScreen.motNextVehicle', { n: vi + 1 })
            : t('dashboard.remindersScreen.motNext'),
          categoryKey: 'transport',
          sectionId: 'transport',
          dateType: 'due',
          dateValue: vehicle.motNextDate,
          actionRoute: '/(app)/costs',
        });
      }
    });
  }

  const location = sections?.location;
  if (location?.residencePermit?.endDate) {
    rows.push({
      id: 'residence-permit-end',
      reminderId: 'residence-permit-end',
      name: t('dashboard.remindersScreen.residencePermit'),
      categoryKey: 'location',
      sectionId: 'location',
      dateType: 'end',
      dateValue: location.residencePermit.endDate,
      actionRoute: '/(app)/dashboard',
    });
  }
  if (location?.partnerResidencePermit?.endDate) {
    rows.push({
      id: 'residence-permit-partner-end',
      reminderId: 'residence-permit-partner-end',
      name: t('dashboard.remindersScreen.residencePermitPartner'),
      categoryKey: 'location',
      sectionId: 'location',
      dateType: 'end',
      dateValue: location.partnerResidencePermit.endDate,
      actionRoute: '/(app)/dashboard',
    });
  }
  if (Array.isArray(location?.childrenCitizenship)) {
    location.childrenCitizenship.forEach((child, index) => {
      if (!child?.residencePermit?.endDate) return;
      rows.push({
        id: `residence-permit-child-${index}-end`,
        reminderId: `residence-permit-child-${index}-end`,
        name: t('dashboard.remindersScreen.residencePermitChild', { n: index + 1 }),
        categoryKey: 'location',
        sectionId: 'location',
        dateType: 'end',
        dateValue: child.residencePermit.endDate,
        actionRoute: '/(app)/dashboard',
      });
    });
  }

  return sortReminderRows(rows);
}

/**
 * @param {ReminderRow[]} rows
 * @returns {ReminderRow[]}
 */
export function sortReminderRows(rows) {
  return [...rows].sort((a, b) => {
    const daysA = reminderDaysUntil(a);
    const daysB = reminderDaysUntil(b);
    if (daysA == null && daysB == null) return a.name.localeCompare(b.name);
    if (daysA == null) return 1;
    if (daysB == null) return -1;
    if (daysA !== daysB) return daysA - daysB;
    return a.name.localeCompare(b.name);
  });
}
