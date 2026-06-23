import { daysInMonth, parseStoredDate } from '../datePicker';
import { todayIsoDate } from './goalIds';

/**
 * @param {string} storedDate - DD/MM/YYYY
 * @returns {string|null} YYYY-MM-DD
 */
export function storedDateToIso(storedDate) {
  const { day, month, year } = parseStoredDate(storedDate, true);
  if (!day || !month || !year) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {{ dayOfMonth: number, dayOfWeek: number }}
 */
export function deriveScheduleAnchors(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return {
    dayOfMonth: d,
    dayOfWeek: date.getDay(),
  };
}

/**
 * @param {import('../schema').GoalFundingRule} rule
 * @returns {string|null}
 */
export function advanceNextRunDate(rule) {
  if (!rule.nextRunDate || rule.frequency === 'once') return null;
  const [y, m, d] = rule.nextRunDate.split('-').map(Number);
  const anchorDay = rule.dayOfMonth || d;

  if (rule.frequency === 'weekly') {
    const next = new Date(y, m - 1, d);
    next.setDate(next.getDate() + 7);
    return todayIsoDate(next);
  }

  if (rule.frequency === 'daily') {
    const next = new Date(y, m - 1, d);
    next.setDate(next.getDate() + 1);
    return todayIsoDate(next);
  }

  if (rule.frequency === 'annual') {
    const nextYear = y + 1;
    const maxDay = daysInMonth(m, nextYear);
    const day = Math.min(anchorDay, maxDay);
    return `${nextYear}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  if (rule.frequency !== 'monthly') return null;

  let nextMonth = m + 1;
  let nextYear = y;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }
  const maxDay = daysInMonth(nextMonth, nextYear);
  const day = Math.min(anchorDay, maxDay);
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {string} DD/MM/YYYY
 */
export function isoDateToStoredDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/**
 * @param {Date} [from]
 * @returns {string} DD/MM/YYYY for tomorrow
 */
export function defaultContributionStartStoredDate(from = new Date()) {
  const next = new Date(from);
  next.setDate(next.getDate() + 1);
  const d = String(next.getDate()).padStart(2, '0');
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const y = next.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * @param {Date} [from]
 * @returns {Date} start of tomorrow
 */
export function tomorrowDate(from = new Date()) {
  const next = new Date(from);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + 1);
  return next;
}

/**
 * @param {Date} [from]
 * @returns {Date} start of today
 */
export function startOfToday(from = new Date()) {
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * @param {Date} [from]
 * @returns {string} DD/MM/YYYY for today
 */
export function todayStoredDate(from = new Date()) {
  const d = String(from.getDate()).padStart(2, '0');
  const m = String(from.getMonth() + 1).padStart(2, '0');
  const y = from.getFullYear();
  return `${d}/${m}/${y}`;
}
