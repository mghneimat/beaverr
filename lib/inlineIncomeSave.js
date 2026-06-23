import { getData, setData } from './storage';
import { notifyDashboardRefresh } from './dashboardRefresh';
import { parseAmount } from './sectionEditStorage';

/**
 * Merge a partial income payload and persist.
 * @param {object} patch
 */
export async function patchIncome(patch) {
  const current = (await getData('beaverr_income')) || {};
  const next = { ...current, ...patch };
  if (patch.otherIncomeRows) {
    next.hasOtherIncome = patch.otherIncomeRows.length > 0;
  }
  await setData('beaverr_income', next);
  notifyDashboardRefresh();
}

/**
 * @param {number} index
 * @param {{ label?: string, amount?: string|number, frequency?: string }} rowPatch
 */
export async function patchOtherIncomeRow(index, rowPatch) {
  const current = (await getData('beaverr_income')) || {};
  const rows = [...(current.otherIncomeRows || [])];
  const existing = rows[index] || {};
  rows[index] = {
    ...existing,
    ...(rowPatch.label !== undefined ? { label: rowPatch.label || null } : {}),
    ...(rowPatch.amount !== undefined
      ? { amount: typeof rowPatch.amount === 'number' ? rowPatch.amount : parseAmount(rowPatch.amount) }
      : {}),
    ...(rowPatch.frequency !== undefined ? { frequency: rowPatch.frequency } : {}),
  };
  await patchIncome({ otherIncomeRows: rows, hasOtherIncome: rows.length > 0 });
}

/**
 * Append a new other-income row.
 * @param {{ label?: string, amount: string|number, frequency?: string }} fields
 */
export async function addOtherIncomeRow({ label, amount, frequency }) {
  const current = (await getData('beaverr_income')) || {};
  const rows = [...(current.otherIncomeRows || [])];
  rows.push({
    label: label || null,
    amount: parseAmount(amount),
    frequency: frequency || 'monthly',
  });
  await patchIncome({ otherIncomeRows: rows, hasOtherIncome: true });
}

/**
 * @param {'user'|'partner'} who
 * @param {{ amount: string, frequency: string }} fields
 */
export async function patchPrimaryIncome(who, { amount, frequency }) {
  const parsed = parseAmount(amount);
  if (who === 'partner') {
    await patchIncome({ partnerAmount: parsed, partnerFrequency: frequency });
  } else {
    await patchIncome({ amount: parsed, frequency });
  }
}

/** @param {{ editKind: string, otherIndex?: number }} row */
export function canDeleteIncomeRow(row) {
  return row.editKind === 'other'
    && row.otherIndex != null
    && row.otherIndex >= 0
    && row.isAdd !== true;
}

/**
 * Remove an other-income row.
 * @param {{ otherIndex: number }} row
 */
export async function deleteIncomeRow(row) {
  if (!canDeleteIncomeRow(row)) {
    throw new Error('Cannot delete this income row');
  }
  const current = (await getData('beaverr_income')) || {};
  const rows = [...(current.otherIncomeRows || [])];
  rows.splice(row.otherIndex, 1);
  await patchIncome({ otherIncomeRows: rows, hasOtherIncome: rows.length > 0 });
}
