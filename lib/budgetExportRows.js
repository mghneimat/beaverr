import { formatCurrency } from './finance';
import { asArray } from './asArray';

/** @typedef {'section' | 'breakdown' | 'category' | 'item' | 'total'} ExportRowLevel */

/**
 * @typedef {Object} BudgetExportRow
 * @property {ExportRowLevel} level
 * @property {string} label
 * @property {string} amount
 * @property {string} currency
 * @property {'default' | 'income' | 'expense' | 'total-positive' | 'total-negative'} tone
 */

/**
 * @param {number} amount
 * @param {string} currencyCode
 * @param {boolean} [forceNegative]
 */
function formatExportAmount(amount, currencyCode, forceNegative = false) {
  const negative = forceNegative || amount < 0;
  const abs = Math.abs(amount);
  const num = formatCurrency(abs, '').trim();
  return {
    amount: negative ? `-${num}` : num,
    currency: currencyCode,
  };
}

/**
 * @param {Object} params
 * @param {Array<{key: string, label: string, amount: number}>} params.summaryRows
 * @param {Array<{label: string, amount: number}>} params.incomeBreakdown
 * @param {Array<{label: string, items: Array<{label: string, amount: number}>}>} params.costsByCategory
 * @param {number} params.totalBudget
 * @param {string} params.currency
 * @param {string} params.totalLabel
 * @returns {BudgetExportRow[]}
 */
export function buildBudgetExportRows({
  summaryRows,
  incomeBreakdown,
  costsByCategory,
  totalBudget,
  currency,
  totalLabel,
}) {
  /** @type {BudgetExportRow[]} */
  const rows = [];

  summaryRows.forEach((row) => {
    const { amount, currency: cur } = formatExportAmount(row.amount, currency);
    rows.push({
      level: 'section',
      label: row.label,
      amount,
      currency: cur,
      tone: 'default',
    });

    if (row.key === 'income') {
      incomeBreakdown.forEach((b) => {
        const parts = formatExportAmount(b.amount, currency);
        rows.push({
          level: 'breakdown',
          label: b.label,
          amount: parts.amount,
          currency: parts.currency,
          tone: 'income',
        });
      });
    }

    if (row.key === 'fixedCosts') {
      asArray(costsByCategory).forEach((cat) => {
        const catMonthly = asArray(cat.items).reduce((sum, item) => sum + (item.amount || 0), 0);
        const catParts = formatExportAmount(catMonthly, currency, true);
        rows.push({
          level: 'category',
          label: cat.label,
          amount: catParts.amount,
          currency: catParts.currency,
          tone: 'expense',
        });
        asArray(cat.items).forEach((item) => {
          const itemParts = formatExportAmount(item.amount || 0, currency, true);
          rows.push({
            level: 'item',
            label: item.label,
            amount: itemParts.amount,
            currency: itemParts.currency,
            tone: 'expense',
          });
        });
      });
    }
  });

  const totalParts = formatExportAmount(totalBudget, currency);
  rows.push({
    level: 'total',
    label: totalLabel,
    amount: totalParts.amount,
    currency: totalParts.currency,
    tone: totalBudget >= 0 ? 'total-positive' : 'total-negative',
  });

  return rows;
}
