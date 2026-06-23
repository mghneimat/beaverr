import { roundMoney } from './finance';

/** @typedef {import('./schema').OverspendCoverage} OverspendCoverage */
/** @typedef {import('./schema').OverspendSource} OverspendSource */

/** @type {readonly OverspendSource[]} */
export const COVERAGE_SOURCES = [
  'cycleSavings',
  'rollover',
  'looseMoney',
  'generalSavings',
  'external',
];

/** @type {readonly import('./schema').ExternalCoverageType[]} */
export const EXTERNAL_COVERAGE_TYPES = [
  'creditCard',
  'friendLoan',
  'familyLoan',
  'bankLoan',
  'overdraft',
  'other',
];

/**
 * @param {{
 *   cycleSavingsRemaining: number,
 *   generalSavingsBalance: number,
 *   rolloverBalance?: number,
 *   looseMoneyBalance?: number,
 * }} params
 * @returns {Record<OverspendSource, number>}
 */
export function buildCoverageLimits({
  cycleSavingsRemaining,
  generalSavingsBalance,
  rolloverBalance = 0,
  looseMoneyBalance = 0,
}) {
  return {
    cycleSavings: Math.max(0, roundMoney(Number(cycleSavingsRemaining) || 0)),
    rollover: Math.max(0, roundMoney(Number(rolloverBalance) || 0)),
    looseMoney: Math.max(0, roundMoney(Number(looseMoneyBalance) || 0)),
    generalSavings: Math.max(0, roundMoney(Number(generalSavingsBalance) || 0)),
    external: Number.MAX_SAFE_INTEGER,
  };
}

/**
 * Editable rows for close-cycle UI — one row per available source.
 * @param {OverspendCoverage[]} defaultRows
 * @param {Record<OverspendSource, number>} limits
 * @param {number} deficit
 * @returns {OverspendCoverage[]}
 */
export function buildEditableCoverageRows(defaultRows, limits, deficit) {
  const bySource = Object.fromEntries(
    (defaultRows || []).map((row) => [row.source, row]),
  );

  return COVERAGE_SOURCES
    .filter((source) => source === 'external' || limits[source] > 0)
    .map((source) => {
      const existing = bySource[source];
      return {
        source,
        amount: existing?.amount ?? 0,
        externalType: existing?.externalType || 'other',
        trackObligation: existing?.trackObligation !== false,
        note: existing?.note ?? null,
      };
    });
}

/**
 * @param {OverspendCoverage[]} coverage
 * @param {number} deficit
 * @param {Record<OverspendSource, number>} limits
 * @returns {{ valid: boolean, code?: 'sum'|'limit'|'empty' }}
 */
export function validateCoverage(coverage, deficit, limits) {
  const target = roundMoney(Number(deficit) || 0);
  if (target <= 0) return { valid: true };

  const rows = (coverage || []).filter((row) => (Number(row.amount) || 0) > 0);
  if (rows.length === 0) return { valid: false, code: 'empty' };

  const total = sumCoverage(rows);
  if (total !== target) return { valid: false, code: 'sum' };

  for (const row of rows) {
    const amt = roundMoney(Number(row.amount) || 0);
    if (row.source !== 'external') {
      const max = limits[row.source] ?? 0;
      if (amt > max) return { valid: false, code: 'limit' };
    }
  }

  return { valid: true };
}

/**
 * @param {OverspendCoverage[]} coverage
 * @returns {OverspendCoverage[]}
 */
export function normalizeCoverageForSave(coverage) {
  return (coverage || [])
    .map((row) => ({
      ...row,
      amount: Math.max(0, roundMoney(Number(row.amount) || 0)),
      note: row.note?.trim() || null,
    }))
    .filter((row) => row.amount > 0);
}

/**
 * Default waterfall for cycle deficit at close.
 * @param {{
 *   deficit: number,
 *   cycleSavingsRemaining: number,
 *   generalSavingsBalance: number,
 *   rolloverBalance?: number,
 *   looseMoneyBalance?: number,
 * }} params
 * @returns {OverspendCoverage[]}
 */
export function buildDefaultCoverage({
  deficit,
  cycleSavingsRemaining,
  generalSavingsBalance,
  rolloverBalance = 0,
  looseMoneyBalance = 0,
}) {
  const amount = Math.max(0, roundMoney(Number(deficit) || 0));
  if (amount === 0) return [];

  /** @type {OverspendCoverage[]} */
  const coverages = [];
  let remaining = amount;

  const fromCycleSavings = Math.min(remaining, Math.max(0, cycleSavingsRemaining));
  if (fromCycleSavings > 0) {
    coverages.push({ amount: fromCycleSavings, source: 'cycleSavings' });
    remaining -= fromCycleSavings;
  }

  const fromRollover = Math.min(remaining, Math.max(0, rolloverBalance));
  if (fromRollover > 0) {
    coverages.push({ amount: fromRollover, source: 'rollover' });
    remaining -= fromRollover;
  }

  const fromLoose = Math.min(remaining, Math.max(0, looseMoneyBalance));
  if (fromLoose > 0) {
    coverages.push({ amount: fromLoose, source: 'looseMoney' });
    remaining -= fromLoose;
  }

  const fromGeneral = Math.min(remaining, Math.max(0, generalSavingsBalance));
  if (fromGeneral > 0) {
    coverages.push({ amount: fromGeneral, source: 'generalSavings' });
    remaining -= fromGeneral;
  }

  if (remaining > 0) {
    coverages.push({
      amount: remaining,
      source: 'external',
      externalType: 'other',
    });
  }

  return coverages;
}

/**
 * Apply coverage to budget/income balances (mutates copies).
 * @param {{
 *   coverage: OverspendCoverage[],
 *   budget: import('./schema').Budget,
 *   income: import('./schema').Income|null|undefined,
 *   cyclePlannedSavings: number,
 * }} params
 */
export function applyCoverageBalances({ coverage, budget, income, cyclePlannedSavings }) {
  let cycleSavingsUsed = 0;
  let generalUsed = 0;
  let rolloverUsed = 0;
  let looseUsed = 0;

  (coverage || []).forEach((row) => {
    const amt = Number(row.amount) || 0;
    if (row.source === 'cycleSavings') cycleSavingsUsed += amt;
    if (row.source === 'generalSavings') generalUsed += amt;
    if (row.source === 'rollover') rolloverUsed += amt;
    if (row.source === 'looseMoney') looseUsed += amt;
  });

  if (rolloverUsed > 0) {
    budget.rolloverBalance = Math.max(0, (Number(budget.rolloverBalance) || 0) - rolloverUsed);
  }
  if (looseUsed > 0) {
    budget.looseMoneyBalance = Math.max(0, (Number(budget.looseMoneyBalance) || 0) - looseUsed);
  }
  if (generalUsed > 0 && income) {
    income.savingsBalance = Math.max(0, (Number(income.savingsBalance) || 0) - generalUsed);
  }

  return {
    cycleSavingsUsed: Math.min(cycleSavingsUsed, cyclePlannedSavings),
    generalUsed,
    rolloverUsed,
    looseUsed,
  };
}

/**
 * Sum coverage rows — must equal deficit for valid close.
 * @param {OverspendCoverage[]} coverage
 * @returns {number}
 */
export function sumCoverage(coverage) {
  return (coverage || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
}
