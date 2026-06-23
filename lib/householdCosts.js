import { toMonthly, totalMonthlyCosts } from './finance';

/** Streaming service keys used in subscription onboarding */
export const STREAMING_SERVICES = [
  'netflix', 'primeVideo', 'disneyPlus', 'appleTvPlus', 'hboMax',
  'spotify', 'appleMusic', 'youtubePremium', 'deezer',
];

/**
 * @param {object|null} inc - Flat income payload from beaverr_income
 * @returns {number}
 */
export function computeTotalMonthlyIncome(inc) {
  const userMonthly = toMonthly(inc?.amount || 0, inc?.frequency || 'monthly');
  const partnerMonthly = toMonthly(inc?.partnerAmount || 0, inc?.partnerFrequency || 'monthly');
  const otherMonthly = (inc?.otherIncomeRows || []).reduce(
    (sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'),
    0,
  );
  return userMonthly + partnerMonthly + otherMonthly;
}

/**
 * @param {{ items: { amount: number, frequency: string }[] }} category
 * @returns {number}
 */
export function categoryMonthlyTotal(category) {
  return totalMonthlyCosts(category.items);
}

/**
 * @param {Array<{ category: string, label: string, items: object[] }>} byCategory
 * @param {number} [limit=3]
 */
export function topCostCategories(byCategory, limit = 3) {
  return [...byCategory]
    .map((cat) => ({ ...cat, monthlyTotal: categoryMonthlyTotal(cat) }))
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal)
    .slice(0, limit);
}
