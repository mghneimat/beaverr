import { dailyAllowance, weeklyAllowance } from './finance';
import {
  isoDateKey,
  getWeekBounds,
  sumSpentOnDate,
  sumSpentBetween,
  getLogForDate,
  nextDay,
} from './dailyLog';
import { buildMonthEndPreview } from './monthEndRouting';
import { computeCyclePace } from './cyclePace';
import { missingDaysInCycle } from './budgetCycle';
import { computeSpendingPace, spendingPaceColor } from './spendingPace';

/**
 * @typedef {'under'|'on_track'|'over'} TrackerPaceStatus
 */

/**
 * @param {number} allowance
 * @param {number} spent
 * @returns {TrackerPaceStatus}
 */
export function getPaceStatus(allowance, spent) {
  const budget = Number(allowance) || 0;
  const used = Number(spent) || 0;
  if (used > budget) return 'over';
  if (budget > 0 && used <= budget * 0.85) return 'under';
  return 'on_track';
}

/**
 * Inclusive day count between two ISO dates.
 * @param {string} startIso
 * @param {string} endIso
 * @returns {number}
 */
function countInclusiveIsoDays(startIso, endIso) {
  if (!startIso || !endIso || startIso > endIso) return 0;
  let count = 0;
  let d = startIso;
  while (d <= endIso) {
    count += 1;
    if (d === endIso) break;
    d = nextDay(d);
  }
  return count;
}

/**
 * @param {import('./spendingPace').SpendingPaceLevel} level
 * @param {number} allowance
 * @param {number} spent
 */
function mapSpendingLevelToDailyStatus(level, allowance, spent) {
  if (spent > allowance) return 'over';
  if (level === 'good' || level === 'alert') return 'under';
  return 'on_track';
}

/**
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   effectiveMonthlyFlexible: number,
 *   dailyLogs: import('./schema').DailyLog[],
 *   activeCycle?: import('./schema').BudgetCycle|null,
 *   cycleAdjustments?: import('./schema').CycleAdjustment[],
 *   now?: Date,
 * }} params
 */
export function buildTrackerPreviews({
  budget,
  effectiveMonthlyFlexible,
  dailyLogs,
  activeCycle,
  cycleAdjustments = [],
  now = new Date(),
}) {
  if (budget?.cyclesEnabled && activeCycle) {
    const pace = computeCyclePace(activeCycle, dailyLogs, budget, now, cycleAdjustments);
    const today = isoDateKey(now);
    const spentToday = sumSpentOnDate(dailyLogs, today);
    const todayLog = getLogForDate(dailyLogs, today);
    const remainingToday = Math.max(0, pace.dailyAllowance - spentToday);
    const overToday = Math.max(0, spentToday - pace.dailyAllowance);
    const dailyStatus = mapSpendingLevelToDailyStatus(
      pace.paceLevel,
      pace.dailyAllowance,
      spentToday,
    );
    const unsetDays = missingDaysInCycle(activeCycle, dailyLogs, now);

    return {
      mode: 'cycle',
      cycle: pace,
      unsetDays,
      periodPace: {
        level: pace.bannerPaceLevel,
        color: spendingPaceColor(pace.bannerPaceLevel),
        timeRatio: pace.timeRatio,
        spentRatio: pace.spentRatio,
        displaySpentRatio: pace.displaySpentRatio,
        ahead: pace.paceAhead,
        scope: 'cycle',
      },
      daily: {
        allowance: pace.dailyAllowance,
        spent: spentToday,
        remaining: remainingToday,
        over: overToday,
        status: dailyStatus,
        hasLogs: todayLog?.status === 'confirmed',
        paceColor: pace.color,
        paceLevel: pace.paceLevel,
      },
      weekly: null,
      monthly: null,
      spendingMonthly: pace.pool,
    };
  }

  const rolloverBalance = Number(budget?.rolloverBalance) || 0;
  const spendingMonthly = (Number(effectiveMonthlyFlexible) || 0) + rolloverBalance;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyBudget = dailyAllowance(spendingMonthly, daysInMonth);
  const weeklyBudget = weeklyAllowance(spendingMonthly);

  const today = isoDateKey(now);
  const spentToday = sumSpentOnDate(dailyLogs, today);
  const remainingToday = Math.max(0, dailyBudget - spentToday);
  const overToday = Math.max(0, spentToday - dailyBudget);

  const { weekStart, weekEnd } = getWeekBounds(now);
  const spentWeek = sumSpentBetween(dailyLogs, weekStart, weekEnd);
  const remainingWeek = Math.max(0, weeklyBudget - spentWeek);
  const overWeek = Math.max(0, spentWeek - weeklyBudget);
  const weekElapsed = countInclusiveIsoDays(weekStart, today);

  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const spentMonth = sumSpentBetween(dailyLogs, monthStart, today);
  const monthRemaining = spendingMonthly - spentMonth;

  const weeklyPace = computeSpendingPace({
    spent: spentWeek,
    budgetEnvelope: weeklyBudget,
    elapsedUnits: weekElapsed,
    totalUnits: 7,
    remaining: remainingWeek,
  });

  const monthlyPace = computeSpendingPace({
    spent: spentMonth,
    budgetEnvelope: spendingMonthly,
    elapsedUnits: now.getDate(),
    totalUnits: daysInMonth,
    remaining: monthRemaining,
  });

  const monthly = buildMonthEndPreview({
    budget,
    effectiveMonthlyFlexible,
    dailyLogs,
    now,
  });

  return {
    mode: 'calendar',
    cycle: null,
    unsetDays: [],
    periodPace: {
      level: monthlyPace.level,
      color: monthlyPace.color,
      timeRatio: monthlyPace.timeRatio,
      spentRatio: monthlyPace.spentRatio,
      ahead: monthlyPace.ahead,
      scope: 'month',
    },
    daily: {
      allowance: dailyBudget,
      spent: spentToday,
      remaining: remainingToday,
      over: overToday,
      status: getPaceStatus(dailyBudget, spentToday),
      hasLogs: spentToday > 0,
      paceLevel: monthlyPace.level,
      paceColor: monthlyPace.color,
    },
    weekly: {
      allowance: weeklyBudget,
      spent: spentWeek,
      remaining: remainingWeek,
      over: overWeek,
      status: getPaceStatus(weeklyBudget, spentWeek),
      weekStart,
      weekEnd,
      hasLogs: spentWeek > 0,
      paceLevel: weeklyPace.level,
      paceColor: weeklyPace.color,
      spendingPace: weeklyPace,
    },
    monthly: {
      ...monthly,
      spendingPace: monthlyPace,
      paceLevel: monthlyPace.level,
      paceColor: monthlyPace.color,
    },
    spendingMonthly,
  };
}
