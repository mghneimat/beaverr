/**
 * Date parsing/countdown helpers for alerts and reminders — no alert graph imports.
 */

import { parseStoredDate } from './datePicker';

/**
 * @param {string} dateStr - DD/MM/YYYY or MM/YYYY
 * @returns {Date|null}
 */
export function parseAlertDate(dateStr) {
  if (!dateStr) return null;
  const { day, month, year } = parseStoredDate(dateStr, dateStr.split('/').length === 3);
  if (!month || !year) return null;
  return new Date(year, month - 1, day || 1);
}

/**
 * @param {Date} target
 * @param {Date} [from=new Date()]
 * @returns {number}
 */
export function daysUntil(target, from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}
