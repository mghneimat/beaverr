import { roundMoney } from './finance';
import { todayIsoDate } from './goals/goalIds';

/**
 * @returns {string}
 */
export function createStashMovementId() {
  return `mv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {import('./schema').Budget|null|undefined} budget
 * @returns {import('./schema').StashMovement[]}
 */
export function getStashMovements(budget) {
  return Array.isArray(budget?.stashMovements) ? budget.stashMovements : [];
}

/**
 * @param {import('./schema').Budget} budget
 * @param {Omit<import('./schema').StashMovement, 'id'>} entry
 * @returns {import('./schema').Budget}
 */
export function appendStashMovement(budget, entry) {
  const amt = roundMoney(Number(entry.amount) || 0);
  if (amt <= 0) return budget;

  const row = {
    id: createStashMovementId(),
    date: entry.date,
    stashRef: entry.stashRef,
    amount: amt,
    direction: entry.direction,
    type: entry.type,
    counterpartyRef: entry.counterpartyRef ?? null,
    counterpartyKind: entry.counterpartyKind ?? null,
    counterpartyLabel: entry.counterpartyLabel ?? null,
    goalId: entry.goalId ?? null,
  };

  return {
    ...budget,
    stashMovements: [...getStashMovements(budget), row],
  };
}

/**
 * @param {import('./schema').Budget} budget
 * @param {import('./schema').StashMovement[]} rows
 * @returns {import('./schema').Budget}
 */
export function appendStashMovements(budget, rows) {
  let next = budget;
  rows.forEach((row) => {
    next = appendStashMovement(next, row);
  });
  return next;
}

/**
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {string} stashRef
 * @returns {import('./schema').StashMovement[]}
 */
export function getMovementsForStashRef(budget, stashRef) {
  return getStashMovements(budget)
    .filter((row) => row.stashRef === stashRef)
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
}

/**
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {string} goalId
 * @returns {import('./schema').StashMovement[]}
 */
export function getMovementsForGoal(budget, goalId) {
  return getStashMovements(budget)
    .filter((row) => row.goalId === goalId || (
      row.type === 'goal_funding' && row.counterpartyRef === goalId
    ))
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
}

/**
 * @param {import('./schema').Budget} budget
 * @param {import('./schema').Income|null|undefined} income
 * @param {import('./stashTransfers').StashRef} fromRef
 * @param {import('./stashTransfers').StashRef} toRef
 * @param {number} amount
 * @param {string} [date]
 * @returns {import('./schema').Budget}
 */
export function logStashTransferMovements(
  budget,
  income,
  fromRef,
  toRef,
  amount,
  date,
) {
  const amt = roundMoney(Number(amount) || 0);
  if (amt <= 0) return budget;

  const day = date || todayIsoDate();

  return appendStashMovements(budget, [
    {
      date: day,
      stashRef: fromRef,
      amount: amt,
      direction: 'out',
      type: 'transfer_out',
      counterpartyRef: toRef,
      counterpartyKind: 'stash',
      counterpartyLabel: null,
      goalId: null,
    },
    {
      date: day,
      stashRef: toRef,
      amount: amt,
      direction: 'in',
      type: 'transfer_in',
      counterpartyRef: fromRef,
      counterpartyKind: 'stash',
      counterpartyLabel: null,
      goalId: null,
    },
  ]);
}

/**
 * @param {import('./schema').Budget} budget
 * @param {import('./schema').Goal} goal
 * @param {string} stashRef
 * @param {number} amount
 * @param {string} [date]
 * @returns {import('./schema').Budget}
 */
export function logGoalFundingMovement(budget, goal, stashRef, amount, date) {
  const amt = roundMoney(Number(amount) || 0);
  if (amt <= 0) return budget;

  return appendStashMovement(budget, {
    date: date || todayIsoDate(),
    stashRef,
    amount: amt,
    direction: 'out',
    type: 'goal_funding',
    counterpartyRef: goal.id,
    counterpartyKind: 'goal',
    counterpartyLabel: goal.name,
    goalId: goal.id,
  });
}

/**
 * @param {import('./schema').Budget} budget
 * @param {import('./schema').DayEndHistoryEntry} entry
 * @returns {import('./schema').Budget}
 */
export function logDayEndStashMovements(budget, entry) {
  let next = budget;
  const date = entry.date;

  if (entry.toLooseMoney > 0) {
    next = appendStashMovement(next, {
      date,
      stashRef: 'looseCash',
      amount: entry.toLooseMoney,
      direction: 'in',
      type: 'day_end',
      counterpartyRef: null,
      counterpartyKind: null,
      counterpartyLabel: null,
      goalId: null,
    });
  }

  if (entry.toSavings > 0) {
    next = appendStashMovement(next, {
      date,
      stashRef: 'savings',
      amount: entry.toSavings,
      direction: 'in',
      type: 'day_end',
      counterpartyRef: null,
      counterpartyKind: null,
      counterpartyLabel: null,
      goalId: null,
    });
  }

  return next;
}

/**
 * @param {import('./schema').Budget} budget
 * @param {import('./schema').MonthEndHistoryEntry} entry
 * @returns {import('./schema').Budget}
 */
export function logMonthEndStashMovements(budget, entry) {
  const amt = roundMoney(Number(entry.amount) || 0);
  if (amt <= 0) return budget;

  const date = periodToLastDayIso(entry.period);
  let stashRef = null;

  if (entry.destination === 'looseMoney') stashRef = 'looseCash';
  else if (entry.destination === 'savings') stashRef = 'savings';
  else if (entry.destination === 'otherGoal' && budget.resetUnspentStashId) {
    stashRef = `stash:${budget.resetUnspentStashId}`;
  }

  if (!stashRef) return budget;

  let next = appendStashMovement(budget, {
    date,
    stashRef,
    amount: amt,
    direction: 'in',
    type: 'month_end',
    counterpartyRef: null,
    counterpartyKind: null,
    counterpartyLabel: null,
    goalId: null,
  });

  const excess = roundMoney(Number(entry.excessToLoose) || 0);
  if (excess > 0) {
    next = appendStashMovement(next, {
      date,
      stashRef: 'looseCash',
      amount: excess,
      direction: 'in',
      type: 'month_end',
      counterpartyRef: null,
      counterpartyKind: null,
      counterpartyLabel: null,
      goalId: null,
    });
  }

  return next;
}

/**
 * @param {import('./schema').Budget|null|undefined} budget
 * @returns {{ budget: import('./schema').Budget, changed: boolean }}
 */
export function backfillStashMovementsFromLegacyHistory(budget) {
  const base = budget && typeof budget === 'object' ? { ...budget } : {};
  if (base.stashMovementsLegacyBackfill) {
    return { budget: base, changed: false };
  }

  let next = { ...base, stashMovements: getStashMovements(base) };
  const dayHistory = Array.isArray(base.dayEndHistory) ? base.dayEndHistory : [];
  const monthHistory = Array.isArray(base.monthEndHistory) ? base.monthEndHistory : [];

  dayHistory.forEach((entry) => {
    next = logDayEndStashMovements(next, entry);
  });
  monthHistory.forEach((entry) => {
    next = logMonthEndStashMovements(next, entry);
  });

  next.stashMovementsLegacyBackfill = true;
  return { budget: next, changed: true };
}

/**
 * Signed amount for display (+ in, − out).
 * @param {import('./schema').StashMovement} row
 * @returns {number}
 */
export function signedMovementAmount(row) {
  const amt = roundMoney(Number(row.amount) || 0);
  return row.direction === 'out' ? -amt : amt;
}

/**
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {string} DD/MM/YYYY
 */
export function isoDateToDisplay(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

/**
 * @param {string} period - YYYY-MM
 * @returns {string}
 */
function periodToLastDayIso(period) {
  const [y, m] = period.split('-').map(Number);
  if (!y || !m) return period;
  const last = new Date(y, m, 0);
  const dd = String(last.getDate()).padStart(2, '0');
  const mm = String(last.getMonth() + 1).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}