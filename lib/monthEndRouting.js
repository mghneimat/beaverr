import { roundMoney } from './finance';
import { setData } from './storage';
import { periodKey, sumSpentInPeriod, loadDailyLogs } from './dailyLog';
import {
  creditCustomStash,
  getCustomStashById,
  getCustomStashes,
} from './customStashes';
import { logMonthEndStashMovements } from './stashMovements';

/**
 * @typedef {'looseMoney'|'savings'|'otherGoal'|'rollover'} MonthEndDestination
 */

/**
 * @typedef {Object} MonthEndRouteResult
 * @property {MonthEndDestination} destination
 * @property {number} amount - Primary routed amount
 * @property {number} [excessToLoose] - Capped rollover overflow
 * @property {number} newRolloverBalance
 */

/**
 * @typedef {Object} MonthEndHistoryEntry
 * @property {string} period - YYYY-MM
 * @property {number} leftover
 * @property {number} spent
 * @property {MonthEndDestination} destination
 * @property {number} amount
 * @property {number} [excessToLoose]
 */

/**
 * @param {'forfeit'|'looseMoney'|'savings'|'otherGoal'|null|undefined} dest
 * @returns {'looseMoney'|'savings'|'otherGoal'}
 */
export function normalizeResetDestination(dest) {
  if (dest === 'savings' || dest === 'otherGoal') return dest;
  return 'looseMoney';
}

/**
 * @param {string} period - YYYY-MM
 * @returns {string}
 */
export function nextPeriod(period) {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m, 1);
  return periodKey(d);
}

/**
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {number} monthlyFlexible
 * @returns {number|null}
 */
export function computeRolloverCap(budget, monthlyFlexible) {
  if (!budget || budget.rolloverStrategy !== 'capped') return null;
  if (budget.rolloverCapType === 'amount') {
    const cap = Number(budget.rolloverCapAmount);
    return cap > 0 ? cap : null;
  }
  const mult = Number(budget.rolloverMultiplier) || 2;
  return Math.max(0, monthlyFlexible * mult);
}

/**
 * @param {{ spendingBudget: number, spentInPeriod: number }} params
 * @returns {number}
 */
export function computeMonthLeftover({ spendingBudget, spentInPeriod }) {
  const budget = Number(spendingBudget) || 0;
  const spent = Number(spentInPeriod) || 0;
  return Math.max(0, budget - spent);
}

/**
 * @param {{
 *   leftover: number,
 *   budget: import('./schema').Budget|null|undefined,
 *   monthlyFlexible: number,
 *   rolloverBalance: number,
 * }} params
 * @returns {MonthEndRouteResult}
 */
export function routeLeftover({ leftover, budget, monthlyFlexible, rolloverBalance }) {
  const amount = roundMoney(Math.max(0, leftover));
  const strategy = budget?.rolloverStrategy === 'capped' ? 'free' : (budget?.rolloverStrategy || 'free');
  const currentRollover = Number(rolloverBalance) || 0;

  if (strategy === 'free') {
    return {
      destination: 'rollover',
      amount,
      newRolloverBalance: currentRollover + amount,
    };
  }

  const dest = normalizeResetDestination(budget?.resetUnspentDestination);
  return {
    destination: dest,
    amount,
    newRolloverBalance: 0,
  };
}

/**
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   effectiveMonthlyFlexible: number,
 *   dailyLogs: import('./schema').DailyLog[],
 *   now?: Date,
 * }} params
 */
export function buildMonthEndPreview({
  budget,
  effectiveMonthlyFlexible,
  dailyLogs,
  now = new Date(),
}) {
  const period = periodKey(now);
  const rolloverBalance = Number(budget?.rolloverBalance) || 0;
  const spendingBudget = (Number(effectiveMonthlyFlexible) || 0) + rolloverBalance;
  const spentSoFar = sumSpentInPeriod(dailyLogs, period);
  const projectedLeftover = computeMonthLeftover({ spendingBudget, spentInPeriod: spentSoFar });
  const route = routeLeftover({
    leftover: projectedLeftover,
    budget,
    monthlyFlexible: effectiveMonthlyFlexible,
    rolloverBalance,
  });

  return {
    period,
    spendingBudget,
    spentSoFar,
    projectedLeftover,
    rolloverBalance,
    route,
    strategy: budget?.rolloverStrategy || 'free',
    resetDestination: budget?.rolloverStrategy === 'reset'
      ? normalizeResetDestination(budget?.resetUnspentDestination)
      : null,
    otherGoalNote: (() => {
      const stash = getCustomStashById(budget, budget?.resetUnspentStashId);
      if (stash?.name) return stash.name;
      return budget?.resetOtherGoalNote || null;
    })(),
  };
}

/**
 * Apply a routed month-end result to budget and income objects (mutates copies).
 * @param {import('./schema').Budget} budget
 * @param {import('./schema').Income|null|undefined} income
 * @param {MonthEndRouteResult} route
 */
export function applyMonthEndRoute(budget, income, route) {
  if (route.destination === 'rollover') {
    budget.rolloverBalance = route.newRolloverBalance;
    if (route.excessToLoose && route.excessToLoose > 0) {
      budget.looseMoneyBalance = (Number(budget.looseMoneyBalance) || 0) + route.excessToLoose;
    }
    return;
  }

  budget.rolloverBalance = 0;
  if (route.destination === 'savings' && income) {
    income.savingsBalance = (Number(income.savingsBalance) || 0) + route.amount;
  } else if (route.destination === 'looseMoney') {
    budget.looseMoneyBalance = (Number(budget.looseMoneyBalance) || 0) + route.amount;
  } else if (route.destination === 'otherGoal') {
    const stashId = budget.resetUnspentStashId;
    if (stashId && creditCustomStash(budget, stashId, route.amount)) {
      return;
    }
    const stashes = getCustomStashes(budget);
    if (stashes.length === 1) {
      creditCustomStash(budget, stashes[0].id, route.amount);
      return;
    }
    budget.otherGoalBalance = (Number(budget.otherGoalBalance) || 0) + route.amount;
  }
}

/**
 * Close completed months through the month before `now`.
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   income: import('./schema').Income|null|undefined,
 *   effectiveMonthlyFlexible: number,
 *   dailyLogs: import('./schema').DailyLog[],
 *   now?: Date,
 * }} params
 * @returns {Promise<{ budget: import('./schema').Budget, income: import('./schema').Income|null, closedPeriods: string[] }>}
 */
export async function processMonthEndIfNeeded({
  budget: rawBudget,
  income: rawIncome,
  effectiveMonthlyFlexible,
  dailyLogs,
  now = new Date(),
}) {
  /** @type {import('./schema').Budget} */
  const budget = { ...(rawBudget || {}) };
  /** @type {import('./schema').Income|null} */
  const income = rawIncome ? { ...rawIncome } : null;
  const currentPeriod = periodKey(now);
  const closedPeriods = [];

  if (!budget.lastClosedPeriod) {
    budget.lastClosedPeriod = currentPeriod;
    budget.looseMoneyBalance = Number(budget.looseMoneyBalance) || 0;
    budget.otherGoalBalance = Number(budget.otherGoalBalance) || 0;
    budget.rolloverBalance = Number(budget.rolloverBalance) || 0;
    budget.monthEndHistory = Array.isArray(budget.monthEndHistory) ? budget.monthEndHistory : [];
    await setData('beaverr_budget', budget);
    return { budget, income, closedPeriods };
  }

  let period = nextPeriod(budget.lastClosedPeriod);
  let changed = false;

  while (period < currentPeriod) {
    const spent = sumSpentInPeriod(dailyLogs, period);
    const rolloverBalance = Number(budget.rolloverBalance) || 0;
    const spendingBudget = (Number(effectiveMonthlyFlexible) || 0) + rolloverBalance;
    const leftover = computeMonthLeftover({ spendingBudget, spentInPeriod: spent });
    const route = routeLeftover({
      leftover,
      budget,
      monthlyFlexible: effectiveMonthlyFlexible,
      rolloverBalance,
    });

    applyMonthEndRoute(budget, income, route);

    /** @type {MonthEndHistoryEntry} */
    const entry = {
      period,
      leftover,
      spent,
      destination: route.destination,
      amount: route.amount,
    };
    if (route.excessToLoose) entry.excessToLoose = route.excessToLoose;

    budget.monthEndHistory = [...(budget.monthEndHistory || []), entry];
    Object.assign(budget, logMonthEndStashMovements(budget, entry));
    budget.lastClosedPeriod = period;
    budget.jarredThisMonth = 0;
    closedPeriods.push(period);
    changed = true;
    period = nextPeriod(period);
  }

  if (changed) {
    await setData('beaverr_budget', budget);
    if (income) await setData('beaverr_income', income);
  }

  return { budget, income, closedPeriods };
}

/**
 * Run month-end close then reload logs (for dashboard bootstrap).
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   income: import('./schema').Income|null|undefined,
 *   effectiveMonthlyFlexible: number,
 *   now?: Date,
 * }} params
 */
export async function ensureMonthEndProcessed({
  budget,
  income,
  effectiveMonthlyFlexible,
  now = new Date(),
}) {
  const dailyLogs = await loadDailyLogs();
  return processMonthEndIfNeeded({
    budget,
    income,
    effectiveMonthlyFlexible,
    dailyLogs,
    now,
  });
}
