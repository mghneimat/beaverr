import { asArray } from './asArray';

/**
 * Coerce persisted category rows so table/export never spread or .map non-arrays.
 * @param {unknown} byCategory
 * @returns {Array<{ category: string, label: string, items: object[] }>}
 */
export function normalizeCostsByCategory(byCategory) {
  return asArray(byCategory).map((cat) => {
    if (!cat || typeof cat !== 'object') {
      return { category: 'other', label: '', items: [] };
    }
    return {
      ...cat,
      items: asArray(cat.items),
    };
  });
}

/**
 * @param {object|null|undefined} income
 * @returns {object|null|undefined}
 */
export function normalizeIncomePayload(income) {
  if (!income || typeof income !== 'object') return income;
  return {
    ...income,
    otherIncomeRows: asArray(income.otherIncomeRows),
  };
}
