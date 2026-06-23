import { getData, setData } from './storage';
import { isoDateKey, nextDay, previousDay } from './dailyLog';
import { roundMoney } from './finance';

/** @typedef {import('./schema').BudgetCycle} BudgetCycle */
/** @typedef {import('./schema').BudgetCycleStore} BudgetCycleStore */
/** @typedef {import('./schema').DailyLog} DailyLog */

export const BUDGET_CYCLES_KEY = 'beaverr_budget_cycles';

/** @type {BudgetCycleStore} */
const EMPTY_CYCLE_STORE = { cycles: [], activeCycleId: null };

/**
 * @param {BudgetCycleStore|null|undefined} store
 * @returns {BudgetCycleStore}
 */
function normalizeCycleStore(store) {
  return store ?? EMPTY_CYCLE_STORE;
}

/**
 * @returns {Promise<BudgetCycleStore>}
 */
export async function loadCycleStore() {
  const raw = await getData(BUDGET_CYCLES_KEY);
  if (!raw || typeof raw !== 'object') {
    return { cycles: [], activeCycleId: null };
  }
  return {
    cycles: Array.isArray(raw.cycles) ? raw.cycles : [],
    activeCycleId: raw.activeCycleId ?? null,
  };
}

/**
 * @param {BudgetCycleStore} store
 * @returns {Promise<void>}
 */
export async function saveCycleStore(store) {
  await setData(BUDGET_CYCLES_KEY, store);
}

/**
 * @param {BudgetCycleStore} store
 * @returns {BudgetCycle|null}
 */
export function getActiveCycle(store) {
  const normalized = normalizeCycleStore(store);
  if (!normalized.activeCycleId) return null;
  return normalized.cycles.find((c) => c.id === normalized.activeCycleId && c.status === 'active') ?? null;
}

/**
 * @param {BudgetCycleStore|null|undefined} store
 * @returns {BudgetCycle[]}
 */
export function getClosedCycles(store) {
  return normalizeCycleStore(store).cycles
    .filter((c) => c.status === 'closed')
    .sort((a, b) => (b.closedAt || b.startedAt).localeCompare(a.closedAt || a.startedAt));
}

/**
 * Most recently closed cycle, if any.
 * @param {BudgetCycleStore} store
 * @returns {BudgetCycle|null}
 */
export function getLastClosedCycle(store) {
  const closed = getClosedCycles(store);
  return closed[0] ?? null;
}

/**
 * @param {string} startedAt - YYYY-MM-DD
 * @param {string} [endIso] - YYYY-MM-DD inclusive upper bound (default yesterday if before today)
 * @param {Date} [now]
 * @returns {string[]}
 */
export function enumerateDaysFrom(startedAt, endIso, now = new Date()) {
  const today = isoDateKey(now);
  const end = endIso && endIso <= today ? endIso : previousDay(today);
  if (!startedAt || startedAt > end) return [];

  const days = [];
  let d = startedAt;
  while (d <= end) {
    days.push(d);
    d = nextDay(d);
  }
  return days;
}

/**
 * Days in cycle range that have no confirmed log.
 * @param {BudgetCycle} cycle
 * @param {DailyLog[]} logs
 * @param {Date} [now]
 * @returns {string[]}
 */
export function missingDaysInCycle(cycle, logs, now = new Date()) {
  const days = enumerateDaysFrom(cycle.startedAt, undefined, now);
  return days.filter((date) => {
    const entry = logs.find((e) => e.date === date && e.cycleId === cycle.id);
    return !entry || entry.status !== 'confirmed';
  });
}

/**
 * True when the cycle started before today and past days still need logging.
 * @param {BudgetCycle|null|undefined} cycle
 * @param {DailyLog[]} logs
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isCycleBackfillPending(cycle, logs, now = new Date()) {
  if (!cycle || cycle.status !== 'active' || !cycle.startedAt) return false;
  const today = isoDateKey(now);
  if (cycle.startedAt >= today) return false;
  return missingDaysInCycle(cycle, logs, now).length > 0;
}

/**
 * @param {BudgetCycle} cycle
 * @param {DailyLog[]} logs
 * @param {string} [throughDate] - inclusive; default today
 * @returns {number}
 */
export function sumSpentInCycle(cycle, logs, throughDate) {
  if (!cycle) return 0;
  const end = throughDate || isoDateKey();
  return (logs || []).reduce((sum, entry) => {
    if (entry.cycleId !== cycle.id) return sum;
    if (entry.status !== 'confirmed') return sum;
    if (entry.date < cycle.startedAt) return sum;
    if (cycle.closedAt && entry.date > cycle.closedAt) return sum;
    if (entry.date > end) return sum;
    return sum + (Number(entry.spent) || 0);
  }, 0);
}

/**
 * @param {number} length
 * @returns {string}
 */
function randomId(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/**
 * @param {{
 *   startedAt: string,
 *   budgetAmount: number,
 *   plannedSavingsAmount?: number,
 * }} params
 * @returns {Promise<BudgetCycle>}
 */
export async function startBudgetCycle({ startedAt, budgetAmount, plannedSavingsAmount = 0 }) {
  const store = await loadCycleStore();
  const active = getActiveCycle(store);
  if (active) {
    throw new Error('An active budget cycle already exists');
  }

  /** @type {BudgetCycle} */
  const cycle = {
    id: randomId(),
    status: 'active',
    startedAt,
    budgetAmount: roundMoney(Number(budgetAmount) || 0),
    plannedSavingsAmount: roundMoney(Number(plannedSavingsAmount) || 0),
    spentTotal: 0,
    surplus: 0,
    deficit: 0,
    createdAt: new Date().toISOString(),
  };

  store.cycles.push(cycle);
  store.activeCycleId = cycle.id;
  await saveCycleStore(store);
  return cycle;
}

/**
 * @param {string} cycleId
 * @param {Partial<BudgetCycle>} patch
 * @returns {Promise<BudgetCycle|null>}
 */
export async function updateBudgetCycle(cycleId, patch) {
  const store = await loadCycleStore();
  const idx = store.cycles.findIndex((c) => c.id === cycleId);
  if (idx < 0) return null;
  store.cycles[idx] = { ...store.cycles[idx], ...patch };
  await saveCycleStore(store);
  return store.cycles[idx];
}

/**
 * Close active cycle and optionally start next.
 * @param {{
 *   cycleId: string,
 *   closedAt: string,
 *   spentTotal: number,
 *   spentAgainstPool?: number,
 *   surplusRouting?: BudgetCycle['surplusRouting'],
 *   coverage?: import('./schema').OverspendCoverage[],
 *   nextCycle?: { startedAt: string, budgetAmount: number, plannedSavingsAmount?: number },
 *   closedWithUnsetDays?: boolean,
 *   budgetBasis?: number,
 * }} params
 * @returns {Promise<{ closed: BudgetCycle, next: BudgetCycle|null }>}
 */
export async function closeBudgetCycle({
  cycleId,
  closedAt,
  spentTotal,
  spentAgainstPool,
  surplusRouting,
  coverage,
  nextCycle,
  closedWithUnsetDays = false,
  budgetBasis,
}) {
  const store = await loadCycleStore();
  const idx = store.cycles.findIndex((c) => c.id === cycleId && c.status === 'active');
  if (idx < 0) throw new Error('Active cycle not found');

  const basis = roundMoney(Number(budgetBasis ?? store.cycles[idx].budgetAmount) || 0);
  const spent = roundMoney(Number(spentTotal) || 0);
  const againstPool = roundMoney(
    Number(spentAgainstPool ?? spentTotal) || 0,
  );
  const surplus = Math.max(0, basis - againstPool);
  const deficit = Math.max(0, againstPool - basis);

  /** @type {BudgetCycle} */
  const closed = {
    ...store.cycles[idx],
    status: 'closed',
    closedAt,
    spentTotal: spent,
    surplus,
    deficit,
    surplusRouting: surplus > 0 ? surplusRouting : undefined,
    coverage: deficit > 0 ? coverage : undefined,
    closedWithUnsetDays,
  };

  store.cycles[idx] = closed;
  store.activeCycleId = null;

  /** @type {BudgetCycle|null} */
  let next = null;
  if (nextCycle) {
    next = {
      id: randomId(),
      status: 'active',
      startedAt: nextCycle.startedAt,
      budgetAmount: roundMoney(Number(nextCycle.budgetAmount) || 0),
      plannedSavingsAmount: roundMoney(Number(nextCycle.plannedSavingsAmount) || 0),
      spentTotal: 0,
      surplus: 0,
      deficit: 0,
      createdAt: new Date().toISOString(),
    };
    store.cycles.push(next);
    store.activeCycleId = next.id;
  }

  await saveCycleStore(store);
  return { closed, next };
}
