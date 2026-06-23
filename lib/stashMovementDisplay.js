import { resolveStashRefLabel } from './goals/goalFundingDisplay';

/**
 * @param {import('./schema').StashMovement} row
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {(key: string, params?: object) => string} t
 * @returns {string}
 */
export function describeStashMovement(row, budget, t) {
  const name = row.counterpartyLabel
    || (row.counterpartyKind === 'stash' && row.counterpartyRef
      ? resolveStashRefLabel(row.counterpartyRef, budget, t)
      : row.counterpartyRef || '');

  switch (row.type) {
    case 'transfer_in':
      return t('dashboard.stashMovements.transferIn', { name });
    case 'transfer_out':
      return t('dashboard.stashMovements.transferOut', { name });
    case 'goal_funding':
      return t('dashboard.stashMovements.goalFunding', {
        name: row.counterpartyLabel || name,
      });
    case 'day_end':
      return t('dashboard.stashMovements.dayEnd');
    case 'month_end':
      return t('dashboard.stashMovements.monthEnd');
    case 'stash_delete':
      return t('dashboard.stashMovements.stashDelete', { name });
    default:
      return row.type;
  }
}

/**
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {string} DD/MM/YYYY — matches goal deadlines and funding dates
 */
export function formatStashMovementTableDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}
