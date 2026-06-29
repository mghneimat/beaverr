import { dailyAllowance, roundMoney } from './finance';
import {
  isoDateKey,
  periodKey,
  isDateInPeriod,
  sumSpentOnDate,
} from './dailyLog';
import { getMonthlySavingsReservation } from './incomeGoals';
import { displayBudget } from './finance';
import { computeCycleDailyAllowanceForDate, computeBackfillPiggyDailyAllowance } from './cyclePace';
import {
  capCycleLeftover,
  dedupeCycleDayEndHistory,
} from './cycleJar';
import { resolveDailySpendingDestination } from './dailySpendingStrategy';
import { logDayEndStashMovements } from './stashMovements';
import { getCustomStashes, normalizeStashDescription } from './customStashes';

/**
 * @typedef {'spendingBoost'|'looseMoney'|'savings'} DailyJarDestination
 */

/**
 * @typedef {Object} DayEndHistoryEntry
 * @property {string} date - YYYY-MM-DD
 * @property {number} dailyAllowance
 * @property {number} spent
 * @property {number} leftover
 * @property {number} [toLooseMoney]
 * @property {number} [toSavings]
 * @property {number} [toActivityJar] - Legacy day-end rows only
 * @property {number} [overflowToLoose] - Legacy day-end rows only
 */

/**
 * @typedef {Object} JarLine
 * @property {string} id
 * @property {string} labelKey
 * @property {string} [labelParamsKey]
 * @property {Record<string, string>} [labelParams]
 * @property {number} balance
 * @property {number|null} [cap]
 * @property {'daily'|'monthly'} cadence
 * @property {string} [helperKey]
 * @property {string} [helperText] - Raw helper copy (e.g. custom stash description)
 * @property {Record<string, string|number>} [helperParams]
 * @property {boolean} [showFillMeter]
 * @property {boolean} [isFull]
 */

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
 * Completed calendar days in the current month before today.
 * @param {Date} [now]
 * @returns {number}
 */
export function completedDaysInMonth(now = new Date()) {
  const dayOfMonth = now.getDate();
  return Math.max(0, dayOfMonth - 1);
}

/**
 * Spendable monthly pool minus amounts moved into jars this month.
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {number} effectiveMonthlyFlexible
 */
export function computeSpendableMonthPool(budget, effectiveMonthlyFlexible) {
  const rollover = Number(budget?.rolloverBalance) || 0;
  const jarred = Number(budget?.jarredThisMonth) || 0;
  const monthPool = (Number(effectiveMonthlyFlexible) || 0) + rollover;
  return Math.max(0, monthPool - jarred);
}

/**
 * Route one day's unspent allowance into piggy bank or savings.
 * @param {{
 *   leftover: number,
 *   budget: import('./schema').Budget,
 * }} params
 */
export function routeDayLeftover({ leftover, budget }) {
  const amount = roundMoney(Math.max(0, leftover));
  const dailyJarEnabled = budget.dailyJarEnabled !== false;
  const destination = resolveDailySpendingDestination(budget);

  const emptyRoute = {
    toActivityJar: 0,
    toLooseMoney: 0,
    toSavings: 0,
    overflowToLoose: 0,
    removedFromPool: 0,
    jarredThisMonth: 0,
  };

  if (!dailyJarEnabled || destination === 'spendingBoost' || amount === 0) {
    return emptyRoute;
  }

  if (destination === 'looseMoney') {
    return {
      ...emptyRoute,
      toLooseMoney: amount,
      removedFromPool: amount,
      jarredThisMonth: amount,
    };
  }

  if (destination === 'savings') {
    return {
      ...emptyRoute,
      toSavings: amount,
      removedFromPool: amount,
      jarredThisMonth: amount,
    };
  }

  return emptyRoute;
}

/**
 * Apply day-end routing (mutates budget copy).
 * @param {import('./schema').Budget} budget
 * @param {ReturnType<typeof routeDayLeftover>} route
 */
export function applyDayEndRoute(budget, route, income = null) {
  if (route.toLooseMoney > 0) {
    budget.looseMoneyBalance = (Number(budget.looseMoneyBalance) || 0) + route.toLooseMoney;
  }
  if (route.toSavings > 0 && income) {
    income.savingsBalance = (Number(income.savingsBalance) || 0) + route.toSavings;
  }
  if (route.removedFromPool > 0) {
    budget.jarredThisMonth = (Number(budget.jarredThisMonth) || 0) + route.removedFromPool;
  }
}

/**
 * Days that would close in this catch-up pass (confirmed logs, not yet in dayEndHistory).
 * @param {{
 *   budget: import('./schema').Budget,
 *   activeCycle: import('./schema').BudgetCycle,
 *   dailyLogs: import('./schema').DailyLog[],
 *   yesterday: string,
 *   processedDates: Set<string>,
 * }} params
 * @returns {string[]}
 */
function collectPendingCycleCloseDays({
  budget,
  activeCycle,
  dailyLogs,
  yesterday,
  processedDates,
}) {
  const pending = [];
  let day = nextDay(budget.lastClosedDay);

  while (day <= yesterday) {
    if (day < activeCycle.startedAt) {
      day = nextDay(day);
      continue;
    }

    if (processedDates.has(day)) {
      day = nextDay(day);
      continue;
    }

    const entry = (dailyLogs || []).find(
      (e) => e.date === day && e.cycleId === activeCycle.id,
    );
    if (!entry || entry.status !== 'confirmed') {
      break;
    }

    pending.push(day);
    day = nextDay(day);
  }

  return pending;
}

/**
 * Confirmed cycle days already marked closed but missing day-end jar history.
 * @param {{
 *   budget: import('./schema').Budget,
 *   activeCycle: import('./schema').BudgetCycle,
 *   dailyLogs: import('./schema').DailyLog[],
 *   processedDates: Set<string>,
 * }} params
 * @returns {string[]}
 */
function listUnjarredClosedCycleDays({
  budget,
  activeCycle,
  dailyLogs,
  processedDates,
}) {
  if (!budget.lastClosedDay || budget.lastClosedDay < activeCycle.startedAt) {
    return [];
  }

  const missing = [];
  let day = activeCycle.startedAt;
  while (day <= budget.lastClosedDay) {
    if (!processedDates.has(day)) {
      const entry = (dailyLogs || []).find(
        (e) => e.date === day && e.cycleId === activeCycle.id,
      );
      if (entry?.status === 'confirmed') {
        missing.push(day);
      }
    }
    day = nextDay(day);
  }
  return missing;
}

/**
 * Past cycle days before yesterday — skip jar for non-piggy destinations.
 * @param {string} day
 * @param {string} yesterday
 * @returns {boolean}
 */
function isBackfillPastDay(day, yesterday) {
  return day < yesterday;
}

/**
 * Any completed calendar day before today — piggy bank uses backfill allowance math.
 * @param {string} day
 * @param {string} today
 * @returns {boolean}
 */
function isPiggyBackfillDay(day, today) {
  return day < today;
}

/**
 * @param {{
 *   budget: import('./schema').Budget,
 *   income: import('./schema').Income|null,
 *   activeCycle: import('./schema').BudgetCycle,
 *   dailyLogs: import('./schema').DailyLog[],
 *   day: string,
 *   entry: import('./schema').DailyLog,
 *   cycleAdjustments: import('./schema').CycleAdjustment[],
 *   processedDates: Set<string>,
 *   today: string,
 *   yesterday: string,
 * }} params
 */
function applyCycleDayJar({
  budget,
  income,
  activeCycle,
  dailyLogs,
  day,
  entry,
  cycleAdjustments,
  processedDates,
  today,
  yesterday,
}) {
  const destination = resolveDailySpendingDestination(budget);
  const backfill = isBackfillPastDay(day, yesterday);
  const piggyBackfill = isPiggyBackfillDay(day, today);

  if (backfill && destination !== 'looseMoney') {
    processedDates.add(day);
    return;
  }

  if (piggyBackfill && destination === 'looseMoney') {
    const dailyBudgetRaw = computeBackfillPiggyDailyAllowance(
      activeCycle,
      dailyLogs,
      day,
      budget,
      cycleAdjustments,
    );
    const spent = Number(entry.spent) || 0;
    const dailyBudget = roundMoney(dailyBudgetRaw);
    const piggy = roundMoney(Math.max(0, dailyBudget - spent));
    const removedFromPool = dailyBudget;

    applyDayEndRoute(budget, {
      toActivityJar: 0,
      toLooseMoney: piggy,
      toSavings: 0,
      overflowToLoose: 0,
      removedFromPool,
      jarredThisMonth: removedFromPool,
    }, income);

    /** @type {DayEndHistoryEntry} */
    const historyEntry = {
      date: day,
      cycleId: activeCycle.id,
      dailyAllowance: dailyBudget,
      spent: roundMoney(spent),
      leftover: piggy,
      closeKind: 'backfill',
      removedFromPool,
      toLooseMoney: piggy,
    };
    budget.dayEndHistory = [...budget.dayEndHistory, historyEntry];
    Object.assign(budget, logDayEndStashMovements(budget, historyEntry));
    processedDates.add(day);
    return;
  }

  const dailyBudgetRaw = computeCycleDailyAllowanceForDate(
    activeCycle,
    dailyLogs,
    day,
    budget,
    cycleAdjustments,
  );
  const spent = Number(entry.spent) || 0;
  const rawLeftover = Math.max(0, dailyBudgetRaw - spent);
  const leftover = capCycleLeftover({
    cycle: activeCycle,
    budget,
    logs: dailyLogs,
    onDateIso: day,
    leftover: rawLeftover,
    cycleAdjustments,
  });
  const route = routeDayLeftover({ leftover, budget });

  applyDayEndRoute(budget, route, income);

  /** @type {DayEndHistoryEntry} */
  const historyEntry = {
    date: day,
    cycleId: activeCycle.id,
    dailyAllowance: roundMoney(dailyBudgetRaw),
    spent: roundMoney(spent),
    leftover: roundMoney(leftover),
    closeKind: 'natural',
  };
  if (route.toLooseMoney) historyEntry.toLooseMoney = route.toLooseMoney;
  if (route.toSavings) historyEntry.toSavings = route.toSavings;
  if (route.overflowToLoose) historyEntry.overflowToLoose = route.overflowToLoose;
  if (route.removedFromPool > 0) historyEntry.removedFromPool = route.removedFromPool;
  budget.dayEndHistory = [...budget.dayEndHistory, historyEntry];
  Object.assign(budget, logDayEndStashMovements(budget, historyEntry));
  processedDates.add(day);
}

/**
 * Process completed days through yesterday (cycle mode).
 * @param {{
 *   budget: import('./schema').Budget,
 *   dailyLogs: import('./schema').DailyLog[],
 *   activeCycle: import('./schema').BudgetCycle,
 *   now?: Date,
 * }} params
 */
function processCycleDayEndIfNeeded({
  budget,
  income,
  dailyLogs,
  activeCycle,
  now = new Date(),
  cycleAdjustments = [],
}) {
  const closedDays = [];
  const today = isoDateKey(now);
  const yesterday = previousDay(today);

  budget.jarredThisMonth = Number(budget.jarredThisMonth) || 0;
  budget.looseMoneyBalance = Number(budget.looseMoneyBalance) || 0;
  budget.dayEndHistory = Array.isArray(budget.dayEndHistory) ? budget.dayEndHistory : [];
  dedupeCycleDayEndHistory(budget, activeCycle);
  budget.dayEndHistory = budget.dayEndHistory.filter(
    (entry) => entry.date < activeCycle.startedAt || entry.cycleId === activeCycle.id,
  );

  if (resolveDailySpendingDestination(budget) === 'looseMoney') {
    budget.dayEndHistory = budget.dayEndHistory.filter((entry) => {
      if (entry.cycleId !== activeCycle.id) return true;
      if (entry.date < activeCycle.startedAt || entry.date >= today) return true;
      return entry.closeKind === 'backfill';
    });
  }

  if (!budget.lastClosedDay) {
    budget.lastClosedDay = previousDay(activeCycle.startedAt);
  }

  const processedDates = new Set(
    budget.dayEndHistory
      .filter((e) => e.date >= activeCycle.startedAt && e.cycleId === activeCycle.id)
      .map((e) => e.date),
  );

  const unjarredClosed = listUnjarredClosedCycleDays({
    budget,
    activeCycle,
    dailyLogs,
    processedDates,
  });
  const destination = resolveDailySpendingDestination(budget);
  const reconcileDays =
    destination === 'looseMoney'
      ? unjarredClosed
      : unjarredClosed.length === 1
        ? unjarredClosed
        : [];

  for (const day of reconcileDays) {
    const entry = (dailyLogs || []).find(
      (e) => e.date === day && e.cycleId === activeCycle.id,
    );
    if (entry?.status === 'confirmed') {
      applyCycleDayJar({
        budget,
        income,
        activeCycle,
        dailyLogs,
        day,
        entry,
        cycleAdjustments,
        processedDates,
        today,
        yesterday,
      });
    }
  }

  if (budget.lastClosedDay >= yesterday) {
    return { budget, closedDays };
  }

  const pendingCloseDays = collectPendingCycleCloseDays({
    budget,
    activeCycle,
    dailyLogs,
    yesterday,
    processedDates,
  });
  /** Jar when one day closes per run — manual log or natural yesterday; skip multi-day bulk catch-up. */
  const jarSingleDayClose = pendingCloseDays.length === 1;

  let day = nextDay(budget.lastClosedDay);

  while (day <= yesterday) {
    if (day < activeCycle.startedAt) {
      budget.lastClosedDay = day;
      day = nextDay(day);
      continue;
    }

    if (processedDates.has(day)) {
      budget.lastClosedDay = day;
      day = nextDay(day);
      continue;
    }

    const entry = (dailyLogs || []).find(
      (e) => e.date === day && e.cycleId === activeCycle.id,
    );
    if (!entry || entry.status !== 'confirmed') {
      break;
    }

    const applyJarRouting = jarSingleDayClose;

    if (applyJarRouting) {
      applyCycleDayJar({
        budget,
        income,
        activeCycle,
        dailyLogs,
        day,
        entry,
        cycleAdjustments,
        processedDates,
        today,
        yesterday,
      });
    }

    closedDays.push(day);
    budget.lastClosedDay = day;
    day = nextDay(day);
  }

  return { budget, closedDays };
}

/**
 * Process completed days through yesterday.
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   effectiveMonthlyFlexible: number,
 *   income?: import('./schema').Income|null,
 *   dailyLogs: import('./schema').DailyLog[],
 *   now?: Date,
 *   activeCycle?: import('./schema').BudgetCycle|null,
 *   cyclesEnabled?: boolean,
 * }} params
 * @returns {{ budget: import('./schema').Budget, income: import('./schema').Income|null, closedDays: string[] }}
 */
export function processDayEndIfNeeded({
  budget: rawBudget,
  income: rawIncome = null,
  effectiveMonthlyFlexible,
  dailyLogs,
  now = new Date(),
  activeCycle = null,
  cyclesEnabled = false,
  cycleAdjustments = [],
}) {
  /** @type {import('./schema').Budget} */
  const budget = { ...(rawBudget || {}) };
  /** @type {import('./schema').Income|null} */
  const income = rawIncome ? { ...rawIncome } : null;

  if (cyclesEnabled && activeCycle) {
    const result = processCycleDayEndIfNeeded({
      budget,
      income,
      dailyLogs,
      activeCycle,
      now,
      cycleAdjustments,
    });
    return { ...result, income };
  }
  const closedDays = [];
  const today = isoDateKey(now);
  const yesterday = previousDay(today);

  budget.jarredThisMonth = Number(budget.jarredThisMonth) || 0;
  budget.looseMoneyBalance = Number(budget.looseMoneyBalance) || 0;
  budget.dayEndHistory = Array.isArray(budget.dayEndHistory) ? budget.dayEndHistory : [];

  if (!budget.lastClosedDay) {
    budget.lastClosedDay = yesterday;
    return { budget, income, closedDays };
  }

  if (budget.lastClosedDay >= yesterday) {
    return { budget, income, closedDays };
  }

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let day = nextDay(budget.lastClosedDay);

  while (day <= yesterday) {
    if (!isDateInPeriod(day, periodKey(now))) {
      day = nextDay(day);
      continue;
    }

    const spendablePool = computeSpendableMonthPool(budget, effectiveMonthlyFlexible);
    const dailyBudgetRaw = dailyAllowance(spendablePool, daysInMonth);
    const spent = sumSpentOnDate(dailyLogs, day);
    const leftoverRaw = Math.max(0, dailyBudgetRaw - spent);
    const route = routeDayLeftover({ leftover: leftoverRaw, budget });

    applyDayEndRoute(budget, route, income);

    /** @type {DayEndHistoryEntry} */
    const entry = {
      date: day,
      dailyAllowance: roundMoney(dailyBudgetRaw),
      spent: roundMoney(spent),
      leftover: roundMoney(leftoverRaw),
    };
    if (route.toLooseMoney) entry.toLooseMoney = route.toLooseMoney;
    if (route.toSavings) entry.toSavings = route.toSavings;
    if (route.overflowToLoose) entry.overflowToLoose = route.overflowToLoose;
    budget.dayEndHistory = [...budget.dayEndHistory, entry];
    Object.assign(budget, logDayEndStashMovements(budget, entry));
    closedDays.push(day);
    budget.lastClosedDay = day;
    day = nextDay(day);
  }

  return { budget, income, closedDays };
}

/**
 * Reset month-scoped jar tracking at month close.
 * @param {import('./schema').Budget} budget
 */
export function resetMonthJarTracking(budget) {
  budget.jarredThisMonth = 0;
}

/**
 * Plain-language summary of the user's jar / rollover setup.
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {(key: string, params?: object) => string} t
 */
export function getJarStrategySummary(budget, t) {
  if (!budget) return '';

  const dailyDest = resolveDailySpendingDestination(budget);
  const dailyKey = `dashboard.home.jars.strategy.daily.${dailyDest}`;
  const dailyPart = t(dailyKey);

  const strategy = budget.rolloverStrategy || 'free';
  let monthlyPart;
  if (strategy === 'free') {
    monthlyPart = t('dashboard.home.jars.strategy.monthly.free');
  } else {
    const dest = budget.resetUnspentDestination;
    if (dest === 'savings') monthlyPart = t('dashboard.home.jars.strategy.monthly.resetSavings');
    else if (dest === 'otherGoal') {
      monthlyPart = t('dashboard.home.jars.strategy.monthly.resetOther', {
        name: budget.resetOtherGoalNote || t('dashboard.savingsScreen.otherGoalFallback'),
      });
    } else {
      monthlyPart = t('dashboard.home.jars.strategy.monthly.resetLoose');
    }
  }

  return `${dailyPart} ${monthlyPart}`;
}

/**
 * Stable key for jar grid enter animations when rollover setup changes.
 * @param {import('./schema').Budget|null|undefined} budget
 * @returns {string}
 */
export function getJarLinesAnimationKey(budget) {
  const daily = resolveDailySpendingDestination(budget);
  const strategy = budget?.rolloverStrategy || 'free';
  if (strategy !== 'reset') return `${daily}-${strategy}`;
  return `${daily}-reset-${budget.resetUnspentDestination || 'looseMoney'}`;
}

/**
 * Animation key for the Savings-tab money stash grid (custom tab add/remove).
 * @param {import('./schema').Budget|null|undefined} budget
 */
export function getSavingsStashAnimationKey(budget) {
  const stashes = getCustomStashes(budget);
  return `savings-stash-${stashes.map((s) => `${s.id}:${s.name}:${s.description || ''}`).join('|') || 'none'}`;
}

/**
 * Auto sinking-fund tabs (renewals, insurance, taxes) vs user-created savings tabs.
 * @param {import('./schema').CustomStash} stash
 * @returns {boolean}
 */
export function isCommitmentStash(stash) {
  return (Number(stash.sinkingTargetAmount) || 0) > 0 || Boolean(stash.sinkingSourceKey);
}

/**
 * @param {import('./schema').CustomStash} stash
 * @returns {JarLine}
 */
export function customStashJarLine(stash) {
  const description = normalizeStashDescription(stash.description);
  const sinkingMonthly = Number(stash.sinkingSuggestedMonthly) || 0;
  const sinkingTarget = Number(stash.sinkingTargetAmount) || 0;
  const helperKey = sinkingTarget > 0 && !description
    ? 'dashboard.savingsScreen.sinkingFund.jarHelper'
    : null;
  return {
    id: `stash:${stash.id}`,
    labelKey: 'dashboard.home.jars.customStash.title',
    labelParams: { name: stash.name },
    balance: Number(stash.balance) || 0,
    cap: sinkingTarget > 0 ? sinkingTarget : null,
    cadence: 'monthly',
    ...(description ? { helperText: description } : {}),
    ...(helperKey ? {
      helperKey,
      helperParams: {
        target: sinkingTarget,
        monthly: sinkingMonthly,
      },
    } : {}),
  };
}

/**
 * Savings-tab stash rows: piggy bank + savings always on the top row; custom tabs below.
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   income: import('./schema').Income|null|undefined,
 * }} params
 * @returns {{ primary: JarLine[], savedCustom: JarLine[], commitmentCustom: JarLine[], custom: JarLine[] }}
 */
export function buildSavingsStashLines({ budget, income }) {
  if (!budget) return { primary: [], savedCustom: [], commitmentCustom: [], custom: [] };

  const looseBalance = Number(budget.looseMoneyBalance) || 0;
  const savingsBal = Number(income?.savingsBalance) || 0;

  const primary = [
    {
      id: 'looseCash',
      labelKey: 'dashboard.home.jars.looseCash.title',
      balance: looseBalance,
      cap: null,
      cadence: 'monthly',
      helperKey: 'dashboard.home.jars.looseCash.helper',
    },
    {
      id: 'savings',
      labelKey: 'dashboard.home.jars.savings.title',
      balance: savingsBal,
      cap: null,
      cadence: 'monthly',
      helperKey: 'dashboard.home.jars.savings.helper',
    },
  ];

  const savedCustom = [];
  const commitmentCustom = [];
  getCustomStashes(budget).forEach((stash) => {
    const line = customStashJarLine(stash);
    if (isCommitmentStash(stash)) {
      commitmentCustom.push(line);
    } else {
      savedCustom.push(line);
    }
  });
  const custom = [...savedCustom, ...commitmentCustom];

  return { primary, savedCustom, commitmentCustom, custom };
}

/**
 * Sum of every savings-tab balance — piggy bank, savings, and custom stashes.
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {import('./schema').Income|null|undefined} income
 * @returns {number}
 */
export function getTotalStashBalance(budget, income) {
  const { primary, custom } = buildSavingsStashLines({ budget, income });
  return [...primary, ...custom].reduce(
    (sum, line) => sum + (Number(line.balance) || 0),
    0,
  );
}

/**
 * Build dashboard jar rows from budget + strategy.
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   effectiveMonthlyFlexible: number,
 *   income: import('./schema').Income|null|undefined,
 * }} params
 * @returns {JarLine[]}
 */
export function buildJarLines({ budget, effectiveMonthlyFlexible, income }) {
  if (!budget) return [];

  const strategy = budget.rolloverStrategy || 'free';
  const lines = [];
  const destination = resolveDailySpendingDestination(budget);

  if (strategy === 'free') {
    const rolloverBalance = Number(budget.rolloverBalance) || 0;
    lines.push({
      id: 'rollover',
      labelKey: 'dashboard.home.jars.rollover.title',
      balance: rolloverBalance,
      cap: null,
      cadence: 'monthly',
      helperKey: 'dashboard.home.jars.rollover.helperFree',
    });
  }

  const looseBalance = Number(budget.looseMoneyBalance) || 0;
  if (looseBalance > 0 || strategy === 'reset' || destination === 'looseMoney') {
    lines.push({
      id: 'looseCash',
      labelKey: 'dashboard.home.jars.looseCash.title',
      balance: looseBalance,
      cap: null,
      cadence: 'monthly',
      helperKey: 'dashboard.home.jars.looseCash.helper',
    });
  }

  const otherBalance = Number(budget.otherGoalBalance) || 0;
  const customStashes = getCustomStashes(budget);
  if (customStashes.length === 0) {
    if (otherBalance > 0 || (strategy === 'reset' && budget.resetUnspentDestination === 'otherGoal')) {
      lines.push({
        id: 'bigPlans',
        labelKey: 'dashboard.home.jars.bigPlans.title',
        labelParamsKey: 'name',
        labelParams: {
          name: budget.resetOtherGoalNote || '',
        },
        balance: otherBalance,
        cap: null,
        cadence: 'monthly',
        helperKey: 'dashboard.home.jars.bigPlans.helper',
      });
    }
  } else {
    customStashes.forEach((stash) => {
      lines.push(customStashJarLine(stash));
    });
  }

  if (strategy === 'reset' && budget.resetUnspentDestination === 'savings') {
    const savingsBal = Number(income?.savingsBalance) || 0;
    lines.push({
      id: 'savings',
      labelKey: 'dashboard.home.jars.savings.title',
      balance: savingsBal,
      cap: null,
      cadence: 'monthly',
      helperKey: 'dashboard.home.jars.savings.helper',
    });
  }

  return lines;
}

/**
 * Saved so far this period: jar deposits from closed days + prorated savings plan.
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   income: import('./schema').Income|null|undefined,
 *   goalGap: { monthlyRequired?: number }|null|undefined,
 *   frequency: 'daily'|'weekly'|'monthly',
 *   dailyLogs: import('./schema').DailyLog[],
 *   effectiveMonthlyFlexible: number,
 *   now?: Date,
 * }} params
 */
export function computeSavedSoFar({
  budget,
  income,
  goalGap,
  frequency,
  dailyLogs,
  effectiveMonthlyFlexible,
  now = new Date(),
}) {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const completedDays = completedDaysInMonth(now);
  const monthlySavings = getMonthlySavingsReservation(income, goalGap);

  const history = Array.isArray(budget?.dayEndHistory) ? budget.dayEndHistory : [];
  const period = periodKey(now);
  const today = isoDateKey(now);

  let underspendSaved = 0;
  history.forEach((entry) => {
    if (!entry.date.startsWith(period)) return;
    if (entry.date >= today) return;
    underspendSaved += (Number(entry.toLooseMoney) || 0)
      + (Number(entry.toSavings) || 0)
      + (Number(entry.toActivityJar) || 0)
      + (Number(entry.overflowToLoose) || 0);
  });

  const elapsedRatio = daysInMonth > 0 ? completedDays / daysInMonth : 0;
  const plannedSavingsElapsed = roundMoney(monthlySavings * elapsedRatio);

  const totalMonthly = underspendSaved + plannedSavingsElapsed;
  const displayTotal = displayBudget(totalMonthly, frequency, daysInMonth);

  return {
    totalMonthly,
    displayAmount: displayTotal,
    underspendSaved,
    plannedSavingsElapsed,
    completedDays,
    daysInMonth,
    includesTodayUnderspend: false,
  };
}

/**
 * Remaining spend allowance at frequency (accounts for jars).
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   effectiveMonthlyFlexible: number,
 *   dailyLogs: import('./schema').DailyLog[],
 *   frequency: 'daily'|'weekly'|'monthly',
 *   now?: Date,
 * }} params
 */
export function computeToSpendRemaining({
  budget,
  effectiveMonthlyFlexible,
  dailyLogs,
  frequency,
  now = new Date(),
}) {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const spendablePool = computeSpendableMonthPool(budget, effectiveMonthlyFlexible);
  const period = periodKey(now);
  const today = isoDateKey(now);

  let spentInPeriod = 0;
  (dailyLogs || []).forEach((entry) => {
    if (isDateInPeriod(entry.date, period)) {
      spentInPeriod += Number(entry.spent) || 0;
    }
  });

  const monthRemaining = Math.max(0, spendablePool - spentInPeriod);
  const displayRemaining = displayBudget(monthRemaining, frequency, daysInMonth);

  const dailyBudget = dailyAllowance(spendablePool, daysInMonth);
  const spentToday = sumSpentOnDate(dailyLogs || [], today);
  const remainingToday = Math.max(0, dailyBudget - spentToday);

  return {
    monthRemaining,
    displayRemaining,
    remainingToday,
    dailyBudget,
    spentToday,
    spendablePool,
  };
}

/**
 * @param {JarLine} line
 * @param {(key: string, params?: Record<string, string>) => string} t
 */
export function getJarTitle(line, t) {
  if (line.labelParams?.name) {
    return t(line.labelKey, { name: line.labelParams.name });
  }
  if (line.id === 'bigPlans' || line.id.startsWith('stash:')) {
    return t('dashboard.home.jars.bigPlans.titleFallback');
  }
  return t(line.labelKey);
}
