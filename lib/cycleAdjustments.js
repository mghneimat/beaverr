import { getData, setData } from './storage';
import { isoDateKey } from './dailyLog';
import { roundMoney } from './finance';

/** @typedef {import('./schema').CycleAdjustment} CycleAdjustment */

export const CYCLE_ADJUSTMENTS_KEY = 'beaverr_cycle_adjustments';

/**
 * @param {CycleAdjustment} row
 * @returns {string}
 */
export function adjustmentEffectiveDate(row) {
  if (row.paymentDate) return row.paymentDate;
  return (row.createdAt || '').slice(0, 10) || isoDateKey();
}

/**
 * @param {CycleAdjustment} row
 * @returns {boolean}
 */
export function adjustmentAffectsPool(row) {
  if (row.kind === 'income') return true;
  return row.funding !== 'elsewhere';
}

/**
 * @param {CycleAdjustment} row
 * @param {string} asOfIso
 * @returns {boolean}
 */
export function isAdjustmentAppliedToPool(row, asOfIso) {
  if (row.status !== 'active') return false;
  if (row.timing === 'next_cycle') return false;
  return adjustmentEffectiveDate(row) <= asOfIso;
}

/**
 * @returns {Promise<CycleAdjustment[]>}
 */
export async function loadCycleAdjustments() {
  const raw = await getData(CYCLE_ADJUSTMENTS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.filter((row) => row && typeof row.id === 'string');
}

/**
 * @param {CycleAdjustment[]} adjustments
 * @returns {Promise<void>}
 */
export async function saveCycleAdjustments(adjustments) {
  await setData(CYCLE_ADJUSTMENTS_KEY, adjustments);
}

/**
 * Active one-offs for a cycle (all timings except cancelled/applied).
 * @param {CycleAdjustment[]} adjustments
 * @param {string} cycleId
 * @returns {CycleAdjustment[]}
 */
export function activeCycleAdjustments(adjustments, cycleId) {
  return (adjustments || []).filter(
    (row) => row.cycleId === cycleId && row.status === 'active',
  );
}

/**
 * @deprecated use activeCycleAdjustments
 */
export function activeImmediateAdjustments(adjustments, cycleId) {
  return activeCycleAdjustments(adjustments, cycleId).filter(
    (row) => row.timing === 'immediate',
  );
}

/**
 * Adjustments that affect pool on a given date.
 * @param {CycleAdjustment[]} adjustments
 * @param {string} cycleId
 * @param {string} [asOfIso]
 * @returns {CycleAdjustment[]}
 */
export function poolAdjustmentsForDate(adjustments, cycleId, asOfIso = isoDateKey()) {
  return activeCycleAdjustments(adjustments, cycleId).filter(
    (row) => isAdjustmentAppliedToPool(row, asOfIso) && adjustmentAffectsPool(row),
  );
}

/**
 * @param {CycleAdjustment[]} adjustments
 * @param {string} cycleId
 * @param {string} [asOfIso]
 * @returns {{ income: number, expense: number }}
 */
export function sumPoolAdjustments(adjustments, cycleId, asOfIso = isoDateKey()) {
  const rows = poolAdjustmentsForDate(adjustments, cycleId, asOfIso);
  return rows.reduce(
    (acc, row) => {
      const amount = Math.max(0, roundMoney(Number(row.amount) || 0));
      if (row.kind === 'income') acc.income += amount;
      else acc.expense += amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );
}

/**
 * @deprecated use sumPoolAdjustments
 */
export function sumImmediateAdjustments(adjustments, cycleId) {
  return sumPoolAdjustments(adjustments, cycleId, isoDateKey());
}

/**
 * Pending next-cycle adjustments for close wizard.
 * @param {CycleAdjustment[]} adjustments
 * @param {string} cycleId
 * @returns {CycleAdjustment[]}
 */
export function pendingNextCycleAdjustments(adjustments, cycleId) {
  return activeCycleAdjustments(adjustments, cycleId).filter(
    (row) => row.timing === 'next_cycle',
  );
}

/**
 * @param {CycleAdjustment[]} adjustments
 * @param {string} cycleId
 * @returns {{ income: number, expense: number }}
 */
export function sumNextCycleAdjustments(adjustments, cycleId) {
  return pendingNextCycleAdjustments(adjustments, cycleId).reduce(
    (acc, row) => {
      if (!adjustmentAffectsPool(row)) return acc;
      const amount = Math.max(0, roundMoney(Number(row.amount) || 0));
      if (row.kind === 'income') acc.income += amount;
      else acc.expense += amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );
}

/**
 * Due today — scheduled/immediate with payment date today, still active.
 * @param {CycleAdjustment[]} adjustments
 * @param {string} cycleId
 * @param {string} [todayIso]
 * @returns {CycleAdjustment[]}
 */
export function dueAdjustmentsToday(adjustments, cycleId, todayIso = isoDateKey()) {
  return activeCycleAdjustments(adjustments, cycleId).filter((row) => {
    if (row.timing === 'next_cycle') return false;
    return adjustmentEffectiveDate(row) === todayIso;
  });
}

/**
 * Upcoming scheduled (future payment date).
 * @param {CycleAdjustment[]} adjustments
 * @param {string} cycleId
 * @param {string} [todayIso]
 * @returns {CycleAdjustment[]}
 */
export function upcomingAdjustments(adjustments, cycleId, todayIso = isoDateKey()) {
  return activeCycleAdjustments(adjustments, cycleId).filter((row) => {
    if (row.timing === 'next_cycle') return false;
    return adjustmentEffectiveDate(row) > todayIso;
  });
}

/**
 * @param {{
 *   cycleId: string,
 *   kind: CycleAdjustment['kind'],
 *   amount: number,
 *   label: string,
 *   timing?: CycleAdjustment['timing'],
 *   paymentDate?: string|null,
 *   funding?: CycleAdjustment['funding'],
 * }} params
 * @returns {Promise<CycleAdjustment>}
 */
export async function createCycleAdjustment({
  cycleId,
  kind,
  amount,
  label,
  timing = 'immediate',
  paymentDate = null,
  funding = 'cycleBudget',
}) {
  const rounded = roundMoney(Number(amount) || 0);
  if (!cycleId || rounded <= 0) {
    throw new Error('Invalid cycle adjustment');
  }

  const resolvedFunding = kind === 'expense' ? funding : 'cycleBudget';
  const resolvedDate = paymentDate || (timing === 'next_cycle' ? null : isoDateKey());

  const adjustments = await loadCycleAdjustments();
  /** @type {CycleAdjustment} */
  const row = {
    id: `cadj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    cycleId,
    kind,
    amount: rounded,
    label: label.trim(),
    timing,
    paymentDate: resolvedDate,
    funding: resolvedFunding,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  adjustments.push(row);
  await saveCycleAdjustments(adjustments);
  return row;
}

/**
 * Mark next-cycle adjustments as applied when closing a cycle.
 * @param {string} cycleId
 * @returns {Promise<{ income: number, expense: number }>}
 */
export async function consumeNextCycleAdjustments(cycleId) {
  const adjustments = await loadCycleAdjustments();
  const delta = sumNextCycleAdjustments(adjustments, cycleId);
  const next = adjustments.map((row) => {
    if (row.cycleId === cycleId && row.timing === 'next_cycle' && row.status === 'active') {
      return { ...row, status: /** @type {const} */ ('applied') };
    }
    return row;
  });
  await saveCycleAdjustments(next);
  return delta;
}

/**
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function cancelCycleAdjustment(id) {
  const adjustments = await loadCycleAdjustments();
  const idx = adjustments.findIndex((row) => row.id === id);
  if (idx < 0) return false;
  adjustments[idx] = { ...adjustments[idx], status: 'cancelled' };
  await saveCycleAdjustments(adjustments);
  return true;
}

/**
 * Human-readable timing key for list rows.
 * @param {CycleAdjustment} row
 * @param {string} [todayIso]
 */
export function adjustmentTimingKey(row, todayIso = isoDateKey()) {
  if (row.timing === 'next_cycle') return 'nextCycle';
  const date = adjustmentEffectiveDate(row);
  if (date > todayIso) return 'scheduled';
  return 'appliedNow';
}
