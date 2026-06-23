import { isoDateKey, nextDay } from './dailyLog';
import { sumSpentInCycle } from './budgetCycle';
import { sumPoolAdjustments } from './cycleAdjustments';

/**
 * Nominal pay-cycle end: same calendar day next month minus one day.
 * @param {string} startIso YYYY-MM-DD
 * @returns {string}
 */
export function addMonthsMinusOneDay(startIso) {
  const [y, m, d] = startIso.split('-').map(Number);
  const end = new Date(y, m - 1 + 1, d - 1);
  return isoDateKey(end);
}

/**
 * Cycle end for pace/allowance math. Closed cycles use closedAt; open cycles extend
 * past nominal end while still active so remaining days never collapses at month boundary.
 * @param {import('./schema').BudgetCycle} cycle
 * @param {string} [asOfIso]
 * @returns {string}
 */
export function resolveCycleEndDate(cycle, asOfIso = isoDateKey()) {
  if (cycle.closedAt) return cycle.closedAt;
  const nominal = addMonthsMinusOneDay(cycle.startedAt);
  return nominal >= asOfIso ? nominal : asOfIso;
}

/**
 * Days from fromIso through cycle end (inclusive).
 * @param {string} fromIso
 * @param {import('./schema').BudgetCycle} cycle
 * @returns {number}
 */
export function countCycleRemainingDaysInclusive(fromIso, cycle) {
  const end = resolveCycleEndDate(cycle, fromIso);
  if (fromIso > end) return 1;
  let count = 0;
  let d = fromIso;
  while (d <= end) {
    count += 1;
    if (d === end) break;
    d = nextDay(d);
  }
  return Math.max(1, count);
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
 * Total days in the pay cycle (start through nominal or actual end).
 * @param {import('./schema').BudgetCycle} cycle
 * @returns {number}
 */
export function countTotalCycleDays(cycle) {
  if (!cycle?.startedAt) return 0;
  const end = cycle.closedAt || addMonthsMinusOneDay(cycle.startedAt);
  return countInclusiveIsoDays(cycle.startedAt, end);
}

/**
 * Inclusive elapsed days from cycle start through asOfIso (capped at cycle end).
 * @param {import('./schema').BudgetCycle} cycle
 * @param {string} [asOfIso]
 * @returns {number}
 */
export function countElapsedCycleDays(cycle, asOfIso = isoDateKey()) {
  if (!cycle?.startedAt) return 0;
  const end = resolveCycleEndDate(cycle, asOfIso);
  const capped = asOfIso > end ? end : asOfIso;
  if (capped < cycle.startedAt) return 0;
  return countInclusiveIsoDays(cycle.startedAt, capped);
}

/**
 * Confirmed log days in cycle, optionally capped at throughDateIso.
 * @param {import('./schema').BudgetCycle} cycle
 * @param {import('./schema').DailyLog[]} logs
 * @param {string} [throughDateIso]
 * @returns {number}
 */
export function countConfirmedCycleDays(cycle, logs, throughDateIso) {
  if (!cycle?.startedAt) return 0;
  const end = cycle.closedAt || addMonthsMinusOneDay(cycle.startedAt);
  return (logs || []).filter((e) => {
    if (e.cycleId !== cycle.id) return false;
    if (e.status !== 'confirmed') return false;
    if (e.date < cycle.startedAt || e.date > end) return false;
    if (throughDateIso && e.date > throughDateIso) return false;
    return true;
  }).length;
}

/**
 * Divisor for daily allowance: cycle days not yet logged (min 1).
 * @param {import('./schema').BudgetCycle} cycle
 * @param {import('./schema').DailyLog[]} logs
 * @param {string} [throughDateIso]
 * @returns {number}
 */
export function countUnloggedCycleDaysForAllowance(cycle, logs, throughDateIso) {
  const total = countTotalCycleDays(cycle);
  const logged = countConfirmedCycleDays(cycle, logs, throughDateIso);
  return Math.max(1, total - logged);
}

/**
 * Piggy/savings routed from a closed day (UI “unspent daily allowance” line).
 * @param {import('./schema').DayEndHistoryEntry|null|undefined} entry
 * @returns {number}
 */
export function unspentJarredInEntry(entry) {
  if (!entry) return 0;
  const routed = (Number(entry.toLooseMoney) || 0) + (Number(entry.toSavings) || 0);
  if (routed > 0) return routed;
  if (Number(entry.toActivityJar) > 0) return Number(entry.toActivityJar);
  return 0;
}

/**
 * Amount removed from the cycle spending pool on a closed day.
 * @param {import('./schema').DayEndHistoryEntry|null|undefined} entry
 * @returns {number}
 */
export function poolReductionInEntry(entry) {
  if (!entry) return 0;
  const explicit = Number(entry.removedFromPool);
  if (explicit > 0) return explicit;
  return unspentJarredInEntry(entry);
}

/**
 * @deprecated Use poolReductionInEntry — kept as alias for callers.
 */
export function removedFromPoolInEntry(entry) {
  return poolReductionInEntry(entry);
}

/**
 * Sum pool reductions from cycle day-end routing (deduped by date — last entry wins).
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {import('./schema').BudgetCycle} cycle
 * @returns {number}
 */
export function sumJarredInCycle(budget, cycle) {
  const history = Array.isArray(budget?.dayEndHistory) ? budget.dayEndHistory : [];
  const byDate = new Map();
  for (const entry of history) {
    if (entry.date < cycle.startedAt) continue;
    if (cycle.closedAt && entry.date > cycle.closedAt) continue;
    if (entry.cycleId && entry.cycleId !== cycle.id) continue;
    byDate.set(entry.date, entry);
  }
  let sum = 0;
  for (const entry of byDate.values()) {
    sum += poolReductionInEntry(entry);
  }
  return sum;
}

/**
 * Sum piggy/savings routed in cycle (for breakdown display).
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {import('./schema').BudgetCycle} cycle
 * @returns {number}
 */
export function sumUnspentJarredInCycle(budget, cycle) {
  const history = Array.isArray(budget?.dayEndHistory) ? budget.dayEndHistory : [];
  const byDate = new Map();
  for (const entry of history) {
    if (entry.date < cycle.startedAt) continue;
    if (cycle.closedAt && entry.date > cycle.closedAt) continue;
    if (entry.cycleId && entry.cycleId !== cycle.id) continue;
    byDate.set(entry.date, entry);
  }
  let sum = 0;
  for (const entry of byDate.values()) {
    sum += unspentJarredInEntry(entry);
  }
  return sum;
}

/**
 * Sum jarred leftovers scoped to the active cycle (deduped dayEndHistory only).
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {import('./schema').BudgetCycle} cycle
 * @returns {number}
 */
export function getEffectiveCycleJarred(budget, cycle) {
  return sumJarredInCycle(budget, cycle);
}

/**
 * Whether a closed day's confirmed spend was already removed via full daily pool reduction.
 * @param {import('./schema').DayEndHistoryEntry|null|undefined} entry
 * @returns {boolean}
 */
function spentAlreadyAccountedInPoolReduction(entry) {
  if (!entry) return false;
  const removed = poolReductionInEntry(entry);
  const unspent = unspentJarredInEntry(entry);
  return removed > unspent + 0.01;
}

/**
 * Spend on a closed day that still reduces the pool after jar routing.
 * Backfill piggy days: only overspend beyond the removed daily slot counts.
 * @param {number} spent
 * @param {import('./schema').DayEndHistoryEntry|null|undefined} entry
 * @returns {number}
 */
function spendAgainstPoolForDay(spent, entry) {
  const amount = Number(spent) || 0;
  if (!entry) return amount;
  if (entry.closeKind === 'backfill') {
    const removed = poolReductionInEntry(entry);
    return Math.max(0, amount - removed);
  }
  if (spentAlreadyAccountedInPoolReduction(entry)) {
    return 0;
  }
  return amount;
}

/**
 * Cycle spend that still reduces the spending pool — piggy backfill days only
 * count overspend beyond the daily allowance slot already removed from pool.
 * @param {import('./schema').BudgetCycle} cycle
 * @param {import('./schema').DailyLog[]} logs
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {string} [throughDateIso]
 * @returns {number}
 */
export function sumSpentAgainstRemainingPool(cycle, logs, budget, throughDateIso) {
  if (!cycle?.startedAt) return 0;
  const end = throughDateIso || isoDateKey();
  const history = Array.isArray(budget?.dayEndHistory) ? budget.dayEndHistory : [];
  const jarByDate = new Map();
  for (const entry of history) {
    if (entry.date < cycle.startedAt) continue;
    if (cycle.closedAt && entry.date > cycle.closedAt) continue;
    if (entry.cycleId && entry.cycleId !== cycle.id) continue;
    jarByDate.set(entry.date, entry);
  }

  return (logs || []).reduce((sum, log) => {
    if (log.cycleId !== cycle.id) return sum;
    if (log.status !== 'confirmed') return sum;
    if (log.date < cycle.startedAt) return sum;
    if (cycle.closedAt && log.date > cycle.closedAt) return sum;
    if (log.date > end) return sum;

    const jarEntry = jarByDate.get(log.date);
    return sum + spendAgainstPoolForDay(log.spent, jarEntry);
  }, 0);
}

/**
 * Remove duplicate day-end rows inside the active cycle (keeps last per date).
 * @param {import('./schema').Budget} budget
 * @param {import('./schema').BudgetCycle} cycle
 */
export function dedupeCycleDayEndHistory(budget, cycle) {
  const history = Array.isArray(budget.dayEndHistory) ? budget.dayEndHistory : [];
  const before = [];
  const byDate = new Map();
  for (const entry of history) {
    if (entry.date < cycle.startedAt) {
      before.push(entry);
      continue;
    }
    if (cycle.closedAt && entry.date > cycle.closedAt) {
      before.push(entry);
      continue;
    }
    if (entry.cycleId && entry.cycleId !== cycle.id) {
      before.push(entry);
      continue;
    }
    byDate.set(entry.date, entry);
  }
  const inCycle = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  budget.dayEndHistory = [...before, ...inCycle];
}

/**
 * Cap day leftover so jarred + spent never exceeds cycle budget (+ rollover/adjustments).
 * @param {{
 *   cycle: import('./schema').BudgetCycle,
 *   budget: import('./schema').Budget,
 *   logs: import('./schema').DailyLog[],
 *   onDateIso: string,
 *   leftover: number,
 *   cycleAdjustments?: import('./schema').CycleAdjustment[],
 * }} params
 * @returns {number}
 */
export function capCycleLeftover({
  cycle,
  budget,
  logs,
  onDateIso,
  leftover,
  cycleAdjustments = [],
}) {
  const rollover = Number(budget?.rolloverBalance) || 0;
  const jarred = sumJarredInCycle(budget, cycle);
  const spent = sumSpentInCycle(cycle, logs, onDateIso);
  const { income, expense } = sumPoolAdjustments(cycleAdjustments, cycle.id, onDateIso);
  const budgetCap = cycle.budgetAmount + rollover + income - expense;
  const maxLeftover = Math.max(0, budgetCap - jarred - spent);
  return Math.min(Math.max(0, leftover), maxLeftover);
}
