import { getData, setData } from './storage';

/**
 * @typedef {import('./schema').DailyLog} DailyLog
 */

/**
 * @param {Date} [date]
 * @returns {string} YYYY-MM
 */
export function periodKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * @param {string} period - YYYY-MM
 * @returns {boolean}
 */
export function isDateInPeriod(isoDate, period) {
  if (!isoDate || !period) return false;
  return isoDate.slice(0, 7) === period;
}

/**
 * @param {unknown} entry
 * @returns {DailyLog}
 */
export function normalizeDailyLogEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return { date: '', spent: null, status: 'unset' };
  }
  const row = /** @type {DailyLog} */ (entry);
  if (row.status === 'confirmed' || row.status === 'unset') {
    return {
      date: row.date,
      spent: row.spent == null ? null : Math.max(0, Number(row.spent) || 0),
      status: row.status,
      cycleId: row.cycleId,
      updatedAt: row.updatedAt,
    };
  }
  const spent = Math.max(0, Number(row.spent) || 0);
  if (spent > 0 || row.spent === 0) {
    return {
      date: row.date,
      spent,
      status: 'confirmed',
      cycleId: row.cycleId,
      updatedAt: row.updatedAt,
    };
  }
  return { date: row.date, spent: null, status: 'unset', cycleId: row.cycleId };
}

/**
 * @returns {Promise<DailyLog[]>}
 */
export async function loadDailyLogs() {
  const logs = await getData('beaverr_daily_log');
  if (!Array.isArray(logs)) return [];
  return logs.map(normalizeDailyLogEntry).filter((e) => e.date);
}

/**
 * @param {DailyLog[]} logs
 * @returns {Promise<void>}
 */
export async function saveDailyLogs(logs) {
  await setData('beaverr_daily_log', logs);
}

/**
 * @param {DailyLog[]} logs
 * @param {string} period - YYYY-MM
 * @returns {number}
 */
export function sumSpentInPeriod(logs, period) {
  if (!Array.isArray(logs) || !period) return 0;
  return logs.reduce((sum, entry) => {
    if (!isDateInPeriod(entry.date, period)) return sum;
    if (entry.status && entry.status !== 'confirmed') return sum;
    return sum + (Number(entry.spent) || 0);
  }, 0);
}

/**
 * @param {Date} [date]
 * @returns {string} YYYY-MM-DD
 */
export function isoDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {string}
 */
export function nextDay(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d + 1);
  return isoDateKey(dt);
}

/**
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {string}
 */
export function previousDay(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d - 1);
  return isoDateKey(dt);
}

/**
 * Monday-start week bounds for a date.
 * @param {Date} [date]
 * @returns {{ weekStart: string, weekEnd: string }}
 */
export function getWeekBounds(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { weekStart: isoDateKey(monday), weekEnd: isoDateKey(sunday) };
}

/**
 * @param {DailyLog[]} logs
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {number}
 */
export function sumSpentOnDate(logs, isoDate) {
  if (!Array.isArray(logs) || !isoDate) return 0;
  const entry = logs.find((e) => e.date === isoDate);
  if (!entry || entry.status === 'unset') return 0;
  return Number(entry.spent) || 0;
}

/**
 * @param {DailyLog[]} logs
 * @param {string} isoDate
 * @returns {DailyLog|null}
 */
export function getLogForDate(logs, isoDate) {
  if (!Array.isArray(logs)) return null;
  return logs.find((e) => e.date === isoDate) ?? null;
}

/**
 * @param {DailyLog[]} logs
 * @param {string} startIso - YYYY-MM-DD inclusive
 * @param {string} endIso - YYYY-MM-DD inclusive
 * @returns {number}
 */
export function sumSpentBetween(logs, startIso, endIso) {
  if (!Array.isArray(logs) || !startIso || !endIso) return 0;
  return logs.reduce((sum, entry) => {
    if (entry.status === 'unset') return sum;
    if (entry.date >= startIso && entry.date <= endIso) {
      return sum + (Number(entry.spent) || 0);
    }
    return sum;
  }, 0);
}

/**
 * @param {DailyLog[]} logs
 * @param {string} isoDate
 * @param {number} spent
 * @param {{ cycleId?: string, confirmZero?: boolean }} [options]
 * @returns {DailyLog[]}
 */
export function upsertDailyLog(logs, isoDate, spent, options = {}) {
  const amount = Math.max(0, Number(spent) || 0);
  const confirmZero = options.confirmZero === true || amount > 0;
  const next = Array.isArray(logs) ? [...logs] : [];
  const idx = next.findIndex((e) => e.date === isoDate);

  if (!confirmZero && amount === 0) {
    if (idx >= 0) next.splice(idx, 1);
    return next;
  }

  /** @type {DailyLog} */
  const row = {
    date: isoDate,
    spent: amount,
    status: 'confirmed',
    cycleId: options.cycleId,
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    next[idx] = { ...next[idx], ...row };
  } else {
    next.push(row);
  }
  return next;
}

/** Legacy helper — removes log for date. */
export function removeDailyLog(logs, isoDate) {
  return (logs || []).filter((e) => e.date !== isoDate);
}
