import { toMonthly } from '../finance.js';
import { asArray } from '../asArray.js';

/**
 * @param {object|null|undefined} household
 * @returns {{ adults: number, children: number, has_partner: boolean }}
 */
function summarizeHousehold(household) {
  const type = household?.type || 'solo';
  const hasPartner = type === 'partner';
  const adults = hasPartner ? 2 : 1;
  const children = asArray(household?.children).length;
  return { adults, children, has_partner: hasPartner };
}

/**
 * @param {object|null|undefined} inc
 * @returns {{ role: string, m: number }[]}
 */
function buildIncomeSources(inc) {
  const sources = [];
  const userM = toMonthly(inc?.amount || 0, inc?.frequency || 'monthly');
  if (userM > 0) {
    sources.push({ role: 'user', m: Math.round(userM) });
  }
  const partnerM = toMonthly(inc?.partnerAmount || 0, inc?.partnerFrequency || 'monthly');
  if (partnerM > 0) {
    sources.push({ role: 'partner', m: Math.round(partnerM) });
  }
  asArray(inc?.otherIncomeRows).forEach((row, index) => {
    const m = toMonthly(row.amount || 0, row.frequency || 'monthly');
    if (m > 0) {
      sources.push({ role: `other_${index + 1}`, m: Math.round(m) });
    }
  });
  return sources;
}

/**
 * Compact privacy-safe snapshot for the advice LLM (matches eval fixture shape).
 * @param {{
 *   financials: import('../householdBudget').HouseholdFinancials,
 *   locale: string,
 * }} input
 * @returns {object}
 */
export function buildFinancialSnapshot({ financials, locale }) {
  const incomeM = Math.round(financials.totalIncome || 0);
  const fixedM = Math.round(financials.fixedCosts || 0);
  const debtM = Math.round(financials.debtPayments || 0);
  const flexM = Math.round(
    financials.effectiveMonthlyFlexible ?? financials.monthlyFlexible ?? 0,
  );
  const fixRatio = incomeM > 0 ? roundRatio((fixedM + debtM) / incomeM) : 0;
  const surplusM = incomeM - fixedM - debtM - flexM;

  return {
    v: 1,
    locale,
    household: summarizeHousehold(financials.sections?.household),
    ledger: {
      currency: financials.currencyCode || 'CZK',
      income_m: incomeM,
      income_sources: buildIncomeSources(financials.income),
      fixed_m: fixedM,
      debt_m: debtM,
      flex_m: flexM,
      surplus_m: Math.round(surplusM),
      fix_ratio: fixRatio,
    },
  };
}

/**
 * @param {number} value
 * @returns {number}
 */
function roundRatio(value) {
  return Math.round(value * 100) / 100;
}
