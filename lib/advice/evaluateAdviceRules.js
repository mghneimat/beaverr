import { asArray } from '../asArray.js';
import { categoryMonthlyTotal } from '../householdCosts.js';

const FIXED_RATIO_TIGHT = 0.8;
const FIXED_RATIO_OVERCOMMITTED = 1.0;
const HIGH_APR = 0.2;
const HOUSING_SHARE_ELEVATED = 0.35;
const DEBT_PAYMENT_RATIO_HIGH = 0.25;
const INCOME_CONCENTRATION = 0.9;

/**
 * @typedef {{ id: string, severity: string, facts: object, detail?: object }} TriggeredRule
 */

/**
 * @param {object} snapshot - Output of buildFinancialSnapshot
 * @param {{
 *   debts?: object[],
 *   byCategory?: { category: string, items?: object[] }[],
 *   financialRisks?: { kind?: string }[],
 *   sections?: { health?: object },
 * }} context
 * @returns {TriggeredRule[]}
 */
export function evaluateAdviceRules(snapshot, context = {}) {
  /** @type {TriggeredRule[]} */
  const rules = [];
  const ledger = snapshot?.ledger || {};
  const incomeM = Number(ledger.income_m) || 0;
  const fixRatio = Number(ledger.fix_ratio) || 0;
  const surplusM = Number(ledger.surplus_m) || 0;
  const debtM = Number(ledger.debt_m) || 0;
  const incomeSources = asArray(ledger.income_sources).filter((s) => (s.m || 0) > 0);

  if (fixRatio > FIXED_RATIO_OVERCOMMITTED) {
    rules.push({
      id: 'overcommitted',
      severity: 'critical',
      facts: { fix_ratio: fixRatio, threshold: FIXED_RATIO_OVERCOMMITTED },
    });
  } else if (fixRatio > FIXED_RATIO_TIGHT) {
    rules.push({
      id: 'fixed_cost_ratio_tight',
      severity: 'warning',
      facts: { fix_ratio: fixRatio, threshold: FIXED_RATIO_TIGHT },
    });
  }

  if (surplusM < 0) {
    rules.push({
      id: 'negative_surplus',
      severity: 'critical',
      facts: { surplus_m: surplusM },
    });
  }

  if (incomeSources.length === 1) {
    rules.push({
      id: 'single_income_household',
      severity: 'info',
      facts: { income_source_count: 1 },
    });
  }

  if (incomeM > 0 && incomeSources.length > 0) {
    const topShare = Math.max(...incomeSources.map((s) => (s.m || 0) / incomeM));
    if (topShare >= INCOME_CONCENTRATION && incomeSources.length > 1) {
      rules.push({
        id: 'income_concentration',
        severity: 'info',
        facts: { top_share: roundRatio(topShare), threshold: INCOME_CONCENTRATION },
      });
    }
  }

  if (incomeM > 0 && debtM / incomeM > DEBT_PAYMENT_RATIO_HIGH) {
    rules.push({
      id: 'debt_payment_ratio_high',
      severity: 'warning',
      facts: {
        debt_ratio: roundRatio(debtM / incomeM),
        threshold: DEBT_PAYMENT_RATIO_HIGH,
      },
    });
  }

  const housingCat = asArray(context.byCategory).find((c) => c.category === 'housing');
  if (incomeM > 0 && housingCat) {
    const housingM = categoryMonthlyTotal(housingCat);
    const housingShare = housingM / incomeM;
    if (housingShare > HOUSING_SHARE_ELEVATED) {
      rules.push({
        id: 'housing_cost_share_elevated',
        severity: 'warning',
        facts: {
          housing_share: roundRatio(housingShare),
          threshold: HOUSING_SHARE_ELEVATED,
        },
      });
    }
  }

  const highAprDebts = buildHighAprDebtDetail(context.debts);
  if (highAprDebts.length > 0) {
    const topApr = Math.max(...highAprDebts.map((d) => d.apr));
    rules.push({
      id: 'high_apr',
      severity: 'warning',
      facts: { apr: topApr, threshold: HIGH_APR },
      detail: { debts: highAprDebts },
    });
  }

  const tplRisks = asArray(context.financialRisks).filter(
    (r) => r.kind === 'vehicle_tpl_liability',
  );
  if (tplRisks.length > 0) {
    rules.push({
      id: 'vehicle_tpl_exposure',
      severity: 'info',
      facts: { vehicle_count: tplRisks.length },
    });
  }

  const health = context.sections?.health;
  const hasHealthPremium = asArray(health?.items).some((item) => parseFloat(item.amount || 0) > 0);
  if (health && !hasHealthPremium) {
    rules.push({
      id: 'health_coverage_gap',
      severity: 'info',
      facts: { has_premium: false },
    });
  }

  return rules;
}

/**
 * @param {object[]|null|undefined} debts
 * @returns {{ ref: string, type: string, balance: number, apr: number, payment_m: number }[]}
 */
function buildHighAprDebtDetail(debts) {
  return asArray(debts)
    .map((debt, index) => {
      const aprPct = parseFloat(debt.apr || 0);
      const apr = aprPct > 1 ? aprPct / 100 : aprPct;
      if (apr <= HIGH_APR) return null;
      return {
        ref: `debt_${index + 1}`,
        type: debt.type || 'other',
        balance: Math.round(parseFloat(debt.balance || 0)),
        apr: roundRatio(apr),
        payment_m: Math.round(parseFloat(debt.minPayment || 0)),
      };
    })
    .filter(Boolean)
    .slice(0, 5);
}

/**
 * @param {number} value
 * @returns {number}
 */
function roundRatio(value) {
  return Math.round(value * 100) / 100;
}
