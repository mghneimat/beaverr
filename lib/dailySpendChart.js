import { dailyAllowance } from './finance';
import { isoDateKey, periodKey, getLogForDate } from './dailyLog';
import { C } from '../constants/onboarding-theme';

/** Stacked-column palette — matches burn-chart semantics (committed / saved / accent / danger). */
export function getDailySpendChartColors() {
  return {
    spent: C.primary,
    saved: C.positive,
    remaining: C.info,
    deficit: C.danger,
    future: C.border,
    skeleton: C.border,
  };
}

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/**
 * @param {string} isoDate YYYY-MM-DD
 * @param {(key: string, params?: Record<string, string>) => string} t
 * @param {string} [locale='en']
 */
export function formatDailySpendTooltipDate(isoDate, t, locale = 'en') {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;

  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  const month = Number(monthStr);
  const monthKey = MONTH_KEYS[month - 1];
  if (!monthKey) return isoDate;

  let monthLabel = t(`common.monthsShort.${monthKey}`);
  if (locale === 'cs') {
    monthLabel = monthLabel.toLowerCase();
  } else {
    monthLabel = monthLabel.charAt(0) + monthLabel.slice(1).toLowerCase();
  }

  return t('dashboard.summaryScreen.dailySpend.tooltipDate', {
    day: String(Number(dayStr)),
    month: monthLabel,
    year: yearStr,
  });
}

/**
 * @typedef {'future'|'under'|'over'|'unset'} DailySpendChartDayStatus
 */

/**
 * @typedef {Object} DailySpendChartDay
 * @property {string} isoDate
 * @property {number} dayOfMonth
 * @property {number} allowance
 * @property {number} spent
 * @property {number} cushion
 * @property {'remaining'|'saved'|null} cushionType
 * @property {number} deficit
 * @property {number} columnHeight
 * @property {boolean} isToday
 * @property {boolean} isFuture
 * @property {boolean} isSkeletonColumn
 * @property {DailySpendChartDayStatus} status
 */

/**
 * @param {number} year
 * @param {number} month 1–12
 */
export function daysInCalendarMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * @param {Date} [now]
 * @param {number} [monthCount=12]
 * @param {string} [locale]
 */
export function buildMonthPeriodOptions(now = new Date(), monthCount = 12, locale = 'en') {
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const options = [];

  for (let i = 0; i < monthCount; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const value = `${y}-${String(m).padStart(2, '0')}`;
    const label = d.toLocaleDateString(tag, { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }

  return options;
}

/**
 * @param {string} period YYYY-MM
 * @param {{
 *   budget?: import('./schema').Budget|null,
 *   effectiveMonthlyFlexible?: number,
 *   now?: Date,
 * }} params
 */
export function resolveMonthlySpendingBudget(period, { budget, effectiveMonthlyFlexible, now = new Date() }) {
  const currentPeriod = periodKey(now);
  const rollover = period === currentPeriod ? (Number(budget?.rolloverBalance) || 0) : 0;
  return (Number(effectiveMonthlyFlexible) || 0) + rollover;
}

/**
 * @param {{
 *   period: string,
 *   dailyLogs?: import('./schema').DailyLog[],
 *   monthlyBudget: number,
 *   now?: Date,
 * }} params
 * @returns {DailySpendChartDay[]}
 */
export function buildDailySpendChartDays({
  period,
  dailyLogs = [],
  monthlyBudget,
  now = new Date(),
}) {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) return [];

  const [year, month] = period.split('-').map(Number);
  const dayCount = daysInCalendarMonth(year, month);
  const allowance = dailyAllowance(monthlyBudget, dayCount);
  const today = isoDateKey(now);
  const prefix = `${period}-`;

  /** @type {DailySpendChartDay[]} */
  const days = [];

  for (let day = 1; day <= dayCount; day += 1) {
    const isoDate = `${prefix}${String(day).padStart(2, '0')}`;
    const isToday = isoDate === today;
    const isFuture = isoDate > today;
    const log = getLogForDate(dailyLogs, isoDate);
    const isLogged = log?.status === 'confirmed';
    const spent = isFuture ? 0 : (isLogged ? (Number(log.spent) || 0) : 0);
    const deficit = !isFuture && isLogged && spent > allowance ? spent - allowance : 0;
    let cushion = !isFuture && isLogged && spent < allowance ? allowance - spent : 0;
    let cushionType = cushion > 0 ? (isToday ? 'remaining' : 'saved') : null;
    const isSkeletonColumn = !isFuture && !isLogged;

    if (isSkeletonColumn) {
      cushion = 0;
      cushionType = null;
    }

    const columnHeight = isFuture || isSkeletonColumn
      ? allowance
      : deficit > 0
        ? spent
        : allowance;
    let status = 'under';
    if (isFuture) status = 'future';
    else if (isSkeletonColumn) status = 'unset';
    else if (deficit > 0) status = 'over';
    else if (isLogged) status = 'under';

    days.push({
      isoDate,
      dayOfMonth: day,
      allowance,
      spent,
      cushion,
      cushionType,
      deficit,
      columnHeight,
      isToday,
      isFuture,
      isSkeletonColumn,
      status,
    });
  }

  return days;
}

/**
 * @param {DailySpendChartDay[]} days
 */
export function maxDailySpendChartHeight(days) {
  if (!days.length) return 1;
  return Math.max(1, ...days.map((d) => d.columnHeight));
}
