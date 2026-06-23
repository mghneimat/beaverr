import { divideMoney } from './finance';
import { isoDateKey } from './dailyLog';
import { sumSpentInCycle } from './budgetCycle';
import { sumPoolAdjustments } from './cycleAdjustments';
import {
  countUnloggedCycleDaysForAllowance,
  countTotalCycleDays,
  countElapsedCycleDays,
  getEffectiveCycleJarred,
  sumSpentAgainstRemainingPool,
} from './cycleJar';
import { computeSpendingPace, spendingPaceColor, maxSpendingPaceLevel } from './spendingPace';

/** @typedef {import('./spendingPace').SpendingPaceLevel} SpendingPaceLevel */

/** @deprecated Use SpendingPaceLevel — kept for legacy callers during migration */
/** @typedef {'ok'|'warning'|'exhausted'|'deficit'} CyclePaceStatus */

/**
 * @param {import('./schema').BudgetCycle} cycle
 * @param {{ rolloverBalance?: number, jarredThisMonth?: number }} [budget]
 * @param {import('./schema').CycleAdjustment[]} [cycleAdjustments]
 * @param {string} [asOfIso]
 */
export function computeCyclePool(cycle, budget, cycleAdjustments = [], asOfIso) {
  const rollover = Number(budget?.rolloverBalance) || 0;
  const jarred = getEffectiveCycleJarred(budget, cycle);
  const basePool = Math.max(0, cycle.budgetAmount + rollover - jarred);
  const onDate = asOfIso || isoDateKey();
  const { income, expense } = sumPoolAdjustments(cycleAdjustments, cycle.id, onDate);
  const pool = Math.max(0, basePool + income - expense);
  return { pool, basePool, adjustmentIncome: income, adjustmentExpense: expense };
}

/**
 * @param {import('./schema').BudgetCycle|null|undefined} cycle
 * @param {import('./schema').DailyLog[]} logs
 * @param {{ rolloverBalance?: number, jarredThisMonth?: number }} [budget]
 * @param {Date} [now]
 * @param {import('./schema').CycleAdjustment[]} [cycleAdjustments]
 */
export function computeCyclePace(cycle, logs, budget, now = new Date(), cycleAdjustments = []) {
  if (!cycle || cycle.status !== 'active') {
    return {
      pool: 0,
      basePool: 0,
      adjustmentIncome: 0,
      adjustmentExpense: 0,
      spent: 0,
      spentAgainstPool: 0,
      remaining: 0,
      remainingDays: 0,
      dailyAllowance: 0,
      usedRatio: 0,
      paceLevel: /** @type {SpendingPaceLevel} */ ('good'),
      bannerPaceLevel: /** @type {SpendingPaceLevel} */ ('good'),
      displayPaceLevel: /** @type {SpendingPaceLevel} */ ('good'),
      paceAhead: 0,
      timeRatio: 0,
      spentRatio: 0,
      displaySpentRatio: 0,
      /** @deprecated */ status: /** @type {CyclePaceStatus} */ ('ok'),
      color: spendingPaceColor('good'),
      budgetAmount: 0,
      deficit: 0,
    };
  }

  const today = isoDateKey(now);
  const { pool, basePool, adjustmentIncome, adjustmentExpense } = computeCyclePool(
    cycle,
    budget,
    cycleAdjustments,
    today,
  );
  const spent = sumSpentInCycle(cycle, logs, today);
  const spentAgainstPool = sumSpentAgainstRemainingPool(cycle, logs, budget, today);
  const remaining = pool - spentAgainstPool;
  const budgetEnvelope = pool + spentAgainstPool;
  const usedRatio = budgetEnvelope > 0
    ? spentAgainstPool / budgetEnvelope
    : (spentAgainstPool > 0 ? 1 : 0);
  const remainingDays = countUnloggedCycleDaysForAllowance(cycle, logs, today);

  const dailyAllowance = Math.max(0, divideMoney(Math.max(0, remaining), remainingDays));

  const spendingPace = computeSpendingPace({
    spent: spentAgainstPool,
    budgetEnvelope,
    elapsedUnits: countElapsedCycleDays(cycle, today),
    totalUnits: countTotalCycleDays(cycle),
    remaining,
  });

  const status = legacyCyclePaceStatus(spendingPace.level);

  const budgetEntered = Math.max(0, Number(cycle.budgetAmount) || 0);
  const displaySpentRatio = budgetEntered > 0
    ? spent / budgetEntered
    : spendingPace.spentRatio;

  const displayPace = budgetEntered > 0
    ? computeSpendingPace({
      spent,
      budgetEnvelope: budgetEntered,
      elapsedUnits: countElapsedCycleDays(cycle, today),
      totalUnits: countTotalCycleDays(cycle),
      remaining: budgetEntered - spent,
    })
    : spendingPace;

  const bannerPaceLevel = maxSpendingPaceLevel(spendingPace.level, displayPace.level);

  return {
    pool,
    basePool,
    adjustmentIncome,
    adjustmentExpense,
    spent,
    spentAgainstPool,
    remaining,
    remainingDays,
    dailyAllowance,
    usedRatio,
    paceLevel: spendingPace.level,
    bannerPaceLevel,
    displayPaceLevel: displayPace.level,
    paceAhead: spendingPace.ahead,
    timeRatio: spendingPace.timeRatio,
    spentRatio: spendingPace.spentRatio,
    displaySpentRatio,
    status,
    color: spendingPace.color,
    budgetAmount: cycle.budgetAmount,
    deficit: Math.max(0, spentAgainstPool - pool),
  };
}

/**
 * Deficit/surplus for cycle close — piggy backfill days do not count spent twice against pool.
 * @param {import('./schema').BudgetCycle} cycle
 * @param {import('./schema').DailyLog[]} logs
 * @param {{ rolloverBalance?: number, jarredThisMonth?: number }} [budget]
 * @param {string} [asOfIso]
 * @param {import('./schema').CycleAdjustment[]} [cycleAdjustments]
 */
export function computeCycleCloseBalance(
  cycle,
  logs,
  budget,
  asOfIso,
  cycleAdjustments = [],
) {
  const onDate = asOfIso || isoDateKey();
  const { pool } = computeCyclePool(cycle, budget, cycleAdjustments, onDate);
  const spentTotal = sumSpentInCycle(cycle, logs, onDate);
  const spentAgainstPool = sumSpentAgainstRemainingPool(cycle, logs, budget, onDate);
  const remaining = pool - spentAgainstPool;
  return {
    pool,
    spentTotal,
    spentAgainstPool,
    remaining,
    deficit: Math.max(0, spentAgainstPool - pool),
    surplus: Math.max(0, remaining),
  };
}

/**
 * @param {SpendingPaceLevel} level
 * @returns {CyclePaceStatus}
 */
export function legacyCyclePaceStatus(level) {
  if (level === 'critical') return 'deficit';
  if (level === 'important') return 'warning';
  if (level === 'alert') return 'warning';
  return 'ok';
}

/**
 * @param {number} usedRatio
 * @param {number} remaining
 * @returns {CyclePaceStatus}
 * @deprecated Use computeSpendingPace / resolveSpendingPaceLevel
 */
export function resolvePaceStatus(usedRatio, remaining) {
  if (remaining < 0) return 'deficit';
  if (usedRatio >= 1) return 'exhausted';
  if (usedRatio >= 0.9) return 'warning';
  return 'ok';
}

/**
 * @param {CyclePaceStatus|SpendingPaceLevel} status
 * @returns {string}
 * @deprecated Use spendingPaceColor
 */
export function paceColor(status) {
  if (status === 'deficit' || status === 'exhausted' || status === 'critical') {
    return spendingPaceColor('critical');
  }
  if (status === 'warning' || status === 'important' || status === 'alert') {
    return spendingPaceColor(status === 'alert' ? 'alert' : 'important');
  }
  return spendingPaceColor('good');
}

/**
 * Daily allowance for a specific date within an active cycle (day-end jar routing).
 * @param {import('./schema').BudgetCycle} cycle
 * @param {import('./schema').DailyLog[]} logs
 * @param {string} onDateIso
 * @param {{ rolloverBalance?: number, jarredThisMonth?: number }} [budget]
 * @param {import('./schema').CycleAdjustment[]} [cycleAdjustments]
 * @returns {number}
 */
export function computeCycleDailyAllowanceForDate(
  cycle,
  logs,
  onDateIso,
  budget,
  cycleAdjustments = [],
) {
  const { pool } = computeCyclePool(cycle, budget, cycleAdjustments, onDateIso);
  const spentAgainstPool = sumSpentAgainstRemainingPool(cycle, logs, budget, onDateIso);
  const remaining = pool - spentAgainstPool;
  const unloggedDays = countUnloggedCycleDaysForAllowance(cycle, logs, onDateIso);
  return Math.max(0, divideMoney(remaining, unloggedDays));
}

/**
 * Daily allowance snapshot for a backfilled past day (piggy bank) — as shown before that day was logged.
 * @param {import('./schema').BudgetCycle} cycle
 * @param {import('./schema').DailyLog[]} logs
 * @param {string} dayIso
 * @param {{ rolloverBalance?: number, jarredThisMonth?: number }} [budget]
 * @param {import('./schema').CycleAdjustment[]} [cycleAdjustments]
 * @returns {number}
 */
export function computeBackfillPiggyDailyAllowance(
  cycle,
  logs,
  dayIso,
  budget,
  cycleAdjustments = [],
) {
  const { pool } = computeCyclePool(cycle, budget, cycleAdjustments);
  const logsExcludingDay = (logs || []).filter(
    (e) => !(e.date === dayIso && e.cycleId === cycle.id),
  );
  const unloggedDays = countUnloggedCycleDaysForAllowance(cycle, logsExcludingDay);
  return Math.max(0, divideMoney(pool, unloggedDays));
}
