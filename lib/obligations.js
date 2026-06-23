import { getData, setData } from './storage';
import { roundMoney } from './finance';

/** @typedef {import('./schema').Obligation} Obligation */

export const OBLIGATIONS_KEY = 'beaverr_obligations';

/**
 * @returns {Promise<Obligation[]>}
 */
export async function loadObligations() {
  const raw = await getData(OBLIGATIONS_KEY);
  return Array.isArray(raw) ? raw : [];
}

/**
 * @param {Obligation[]} obligations
 * @returns {Promise<void>}
 */
export async function saveObligations(obligations) {
  await setData(OBLIGATIONS_KEY, obligations);
}

/**
 * @returns {Promise<Obligation[]>}
 */
export async function loadOpenObligations() {
  const all = await loadObligations();
  return all.filter((o) => o.status === 'open');
}

/**
 * @param {{
 *   amount: number,
 *   source: Obligation['source'],
 *   note?: string,
 *   fromCycleId: string,
 * }} params
 * @returns {Promise<Obligation>}
 */
export async function createObligation({ amount, source, note, fromCycleId }) {
  const obligations = await loadObligations();
  /** @type {Obligation} */
  const row = {
    id: `obl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    amount: roundMoney(Number(amount) || 0),
    remainingAmount: roundMoney(Number(amount) || 0),
    source,
    note: note?.trim() || null,
    fromCycleId,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  obligations.push(row);
  await saveObligations(obligations);
  return row;
}

/**
 * @param {string} id
 * @param {number} [paymentAmount] - full remaining if omitted
 * @returns {Promise<Obligation|null>}
 */
export async function markObligationPaid(id, paymentAmount) {
  const obligations = await loadObligations();
  const idx = obligations.findIndex((o) => o.id === id);
  if (idx < 0) return null;

  const row = obligations[idx];
  const pay = paymentAmount != null
    ? roundMoney(Number(paymentAmount) || 0)
    : row.remainingAmount;
  const nextRemaining = Math.max(0, row.remainingAmount - pay);

  obligations[idx] = {
    ...row,
    remainingAmount: nextRemaining,
    status: nextRemaining <= 0 ? 'paid' : 'open',
    paidAt: nextRemaining <= 0 ? new Date().toISOString() : row.paidAt,
  };
  await saveObligations(obligations);
  return obligations[idx];
}
