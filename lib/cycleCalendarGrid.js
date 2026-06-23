import { getLogForDate, isoDateKey, nextDay } from './dailyLog';

/** @typedef {'empty'|'outside'|'locked'|'unset'|'confirmed'} CycleCalendarDayKind */

/**
 * @typedef {Object} CycleCalendarDayCell
 * @property {string|null} isoDate
 * @property {number} dayOfMonth
 * @property {CycleCalendarDayKind} kind
 * @property {boolean} isToday
 * @property {number|null} spent
 */

export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {number} Monday-start column index 0–6
 */
function mondayColumn(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 ? 6 : day - 1;
}

/**
 * @param {string|null} isoDate
 * @param {string|null} cycleStart
 * @param {string} todayIso
 * @returns {boolean}
 */
export function isDateInCycleRange(isoDate, cycleStart, todayIso) {
  if (!isoDate || !cycleStart) return false;
  return isoDate >= cycleStart && isoDate <= todayIso;
}

/**
 * @param {string} cycleStart
 * @param {string} todayIso
 * @returns {string[]}
 */
export function enumerateCycleDaysInclusive(cycleStart, todayIso) {
  if (!cycleStart || cycleStart > todayIso) return [];
  const days = [];
  let d = cycleStart;
  while (d <= todayIso) {
    days.push(d);
    d = nextDay(d);
  }
  return days;
}

/**
 * @param {number} year
 * @param {number} monthIndex - 0–11
 * @param {string} locale
 * @returns {string}
 */
export function formatMonthYearLabel(year, monthIndex, locale) {
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return new Date(year, monthIndex, 1).toLocaleDateString(tag, {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * @param {number} year
 * @param {number} monthIndex - 0–11
 * @param {number} delta - -1 or +1
 * @returns {{ year: number, monthIndex: number }}
 */
/**
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {{ year: number, monthIndex: number }}
 */
export function monthIndexFromIso(isoDate) {
  const [y, m] = isoDate.split('-').map(Number);
  return { year: y, monthIndex: m - 1 };
}

export function shiftCalendarMonth(year, monthIndex, delta) {
  let y = year;
  let m = monthIndex + delta;
  if (m < 0) {
    m = 11;
    y -= 1;
  } else if (m > 11) {
    m = 0;
    y += 1;
  }
  return { year: y, monthIndex: m };
}

/**
 * @param {string|null} cycleStart
 * @param {string} [todayIso]
 * @returns {{ minYear: number, minMonth: number, maxYear: number, maxMonth: number }}
 * @deprecated Prefer shiftCalendarMonth — month browsing is not limited to cycle bounds.
 */
export function getCycleMonthBounds(cycleStart, todayIso = isoDateKey()) {
  if (!cycleStart) {
    const t = new Date();
    return {
      minYear: t.getFullYear(),
      minMonth: t.getMonth(),
      maxYear: t.getFullYear(),
      maxMonth: t.getMonth(),
    };
  }
  const [sy, sm] = cycleStart.split('-').map(Number);
  const [ty, tm] = todayIso.split('-').map(Number);
  return {
    minYear: sy,
    minMonth: sm - 1,
    maxYear: ty,
    maxMonth: tm - 1,
  };
}

/**
 * @param {number} year
 * @param {number} monthIndex
 * @param {{ minYear: number, minMonth: number, maxYear: number, maxMonth: number }} bounds
 * @param {number} delta - -1 or +1
 * @returns {{ year: number, monthIndex: number }|null}
 * @deprecated Use shiftCalendarMonth for unrestricted month browsing.
 */
export function shiftViewMonth(year, monthIndex, bounds, delta) {
  let y = year;
  let m = monthIndex + delta;
  if (m < 0) {
    m = 11;
    y -= 1;
  } else if (m > 11) {
    m = 0;
    y += 1;
  }
  const minKey = bounds.minYear * 12 + bounds.minMonth;
  const maxKey = bounds.maxYear * 12 + bounds.maxMonth;
  const nextKey = y * 12 + m;
  if (nextKey < minKey || nextKey > maxKey) return null;
  return { year: y, monthIndex: m };
}

/**
 * @param {number} year
 * @param {number} monthIndex
 * @param {{
 *   activeCycle?: import('./schema').BudgetCycle|null,
 *   dailyLogs?: import('./schema').DailyLog[],
 *   todayIso?: string,
 * }} options
 * @returns {CycleCalendarDayCell[]}
 */
export function buildMonthGrid(year, monthIndex, options = {}) {
  const {
    activeCycle = null,
    dailyLogs = [],
    todayIso = isoDateKey(),
  } = options;

  const cycleStart = activeCycle?.startedAt ?? null;
  const cycleId = activeCycle?.id ?? null;
  const locked = !activeCycle;

  const firstIso = isoDateKey(new Date(year, monthIndex, 1));
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const startPad = mondayColumn(firstIso);

  /** @type {CycleCalendarDayCell[]} */
  const cells = [];

  for (let i = 0; i < startPad; i += 1) {
    cells.push({
      isoDate: null,
      dayOfMonth: 0,
      kind: 'empty',
      isToday: false,
      spent: null,
    });
  }

  for (let day = 1; day <= lastDay; day += 1) {
    const isoDate = isoDateKey(new Date(year, monthIndex, day));
    const isToday = isoDate === todayIso;
    const inCycle = isDateInCycleRange(isoDate, cycleStart, todayIso);

    if (locked) {
      cells.push({
        isoDate,
        dayOfMonth: day,
        kind: 'locked',
        isToday,
        spent: null,
      });
      continue;
    }

    if (!inCycle) {
      cells.push({
        isoDate,
        dayOfMonth: day,
        kind: 'outside',
        isToday,
        spent: null,
      });
      continue;
    }

    const entry = getLogForDate(dailyLogs, isoDate);
    const confirmed = entry?.status === 'confirmed' && entry.cycleId === cycleId;
    cells.push({
      isoDate,
      dayOfMonth: day,
      kind: confirmed ? 'confirmed' : 'unset',
      isToday,
      spent: confirmed ? Number(entry.spent) || 0 : null,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      isoDate: null,
      dayOfMonth: 0,
      kind: 'empty',
      isToday: false,
      spent: null,
    });
  }

  return cells;
}
