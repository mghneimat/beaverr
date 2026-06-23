import { enumerateCycleDaysInclusive } from './cycleCalendarGrid';
import { getWeekBounds, isoDateKey } from './dailyLog';

/**
 * @typedef {'unset'|'confirmed'} CycleDayRowStatus
 */

/**
 * @typedef {Object} CycleDayRow
 * @property {string} isoDate
 * @property {number|null} spent
 * @property {CycleDayRowStatus} status
 * @property {boolean} isToday
 */

/**
 * @typedef {Object} CycleDayLedgerSummary
 * @property {number} totalDays
 * @property {number} loggedDays
 * @property {number} spentTotal
 */

/**
 * @typedef {Object} CycleDayWeekGroup
 * @property {string} weekStart
 * @property {string} weekEnd
 * @property {CycleDayRow[]} rows — newest day first within the week
 */

/** @param {string} isoDate */
function parseIsoDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Build one row per cycle day from start through today (newest first).
 * @param {import('./schema').BudgetCycle|null|undefined} cycle
 * @param {import('./schema').DailyLog[]} dailyLogs
 * @param {Date} [now]
 * @returns {CycleDayRow[]}
 */
export function buildCycleDayRows(cycle, dailyLogs, now = new Date()) {
  if (!cycle?.startedAt) return [];

  const today = isoDateKey(now);
  const days = enumerateCycleDaysInclusive(cycle.startedAt, today);

  return days.map((isoDate) => {
    const entry = (dailyLogs || []).find(
      (e) => e.date === isoDate && e.cycleId === cycle.id,
    );
    const confirmed = entry?.status === 'confirmed';

    return {
      isoDate,
      spent: confirmed ? Number(entry.spent) || 0 : null,
      status: confirmed ? 'confirmed' : 'unset',
      isToday: isoDate === today,
    };
  }).reverse();
}

/**
 * Group cycle day rows by Monday-start week — newest week first, newest day first in each week.
 * @param {CycleDayRow[]} rows
 * @returns {CycleDayWeekGroup[]}
 */
export function groupCycleDayRowsByWeek(rows) {
  /** @type {Map<string, CycleDayRow[]>} */
  const byWeek = new Map();

  for (const row of rows) {
    const { weekStart } = getWeekBounds(parseIsoDate(row.isoDate));
    if (!byWeek.has(weekStart)) byWeek.set(weekStart, []);
    byWeek.get(weekStart).push(row);
  }

  return [...byWeek.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((weekStart) => {
      const weekRows = byWeek.get(weekStart).sort((a, b) => b.isoDate.localeCompare(a.isoDate));
      const { weekEnd } = getWeekBounds(parseIsoDate(weekStart));
      return { weekStart, weekEnd, rows: weekRows };
    });
}

/**
 * @param {string} weekStart
 * @param {string} weekEnd
 * @param {string} [locale]
 */
export function formatWeekRangeLabel(weekStart, weekEnd, locale = 'en') {
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const start = parseIsoDate(weekStart);
  const end = parseIsoDate(weekEnd);
  const sameMonth = weekStart.slice(0, 7) === weekEnd.slice(0, 7);
  const sameYear = weekStart.slice(0, 4) === weekEnd.slice(0, 4);

  if (sameMonth && sameYear) {
    const monthYear = end.toLocaleDateString(tag, { month: 'short', year: 'numeric' });
    return `${start.getDate()}–${end.getDate()} ${monthYear}`;
  }

  const startLabel = start.toLocaleDateString(tag, {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
  const endLabel = end.toLocaleDateString(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

/**
 * @param {CycleDayRow[]} rows
 * @returns {CycleDayLedgerSummary}
 */
export function buildCycleDayLedgerSummary(rows) {
  const totalDays = rows.length;
  const loggedDays = rows.filter((row) => row.status === 'confirmed').length;
  const spentTotal = rows.reduce(
    (sum, row) => sum + (row.status === 'confirmed' ? (row.spent ?? 0) : 0),
    0,
  );

  return { totalDays, loggedDays, spentTotal };
}

/**
 * @param {CycleDayRow[]} rows
 * @param {'needs'|'all'} filter
 * @returns {CycleDayRow[]}
 */
export function filterCycleDayRows(rows, filter) {
  if (filter === 'needs') {
    return rows.filter((row) => row.status === 'unset');
  }
  return rows;
}
