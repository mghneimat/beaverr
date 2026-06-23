import { formatCurrency, totalMonthlyCosts, parseMoneyAmount } from '../finance';
import { computeTotalMonthlyIncome } from '../householdCosts';
import { aggregateHouseholdCosts } from '../householdBudget';
import { buildReviewAlertEditRoute } from '../reviewEditNavigation';
import { buildReviewRowEditRoute } from '../reviewRowEdit';
import {
  childCostMonthlyTotal,
  firstUnconfirmedHealthMember,
  healthMemberLabel,
  monthlyAmount,
  summarizeHealthMembers,
} from './reviewFormatters';

function sumCategoryFromCosts(byCategory, categoryKey) {
  const cat = byCategory.find((c) => c.category === categoryKey);
  return cat ? totalMonthlyCosts(cat.items) : 0;
}

/**
 * @param {Record<string, unknown>} allData
 * @param {(key: string, params?: object) => string} t
 */
export function buildReviewFinancials(allData, t) {
  const household = allData.beaverr_household || {};
  const income = allData.beaverr_income;
  const debts = allData.beaverr_debts || [];
  const transport = allData.beaverr_transport;
  const health = allData.beaverr_health;
  const childrenCosts = allData.beaverr_children_costs;
  const pets = allData.beaverr_pets || [];
  const subs = allData.beaverr_subscriptions || [];
  const otherCosts = allData.beaverr_other_costs || [];
  const loc = allData.beaverr_location;
  const currency = loc?.currency || 'CZK';

  const { allCosts, byCategory } = aggregateHouseholdCosts({
    housing: allData.beaverr_housing || {},
    transport,
    health,
    childrenCosts,
    pets,
    subs,
    otherCosts,
    household,
  }, t);

  const totalIncome = computeTotalMonthlyIncome(income);
  const fixedCosts = totalMonthlyCosts(allCosts);
  const debtPayments = debts.reduce((sum, d) => sum + parseFloat(d.minPayment || 0), 0);
  const totalExpenses = fixedCosts + debtPayments;
  const monthlyBalance = totalIncome - totalExpenses;

  const transportMonthly = sumCategoryFromCosts(byCategory, 'transport');
  const childrenMonthly = sumCategoryFromCosts(byCategory, 'children');
  const subsMonthly = sumCategoryFromCosts(byCategory, 'subscriptions');
  const otherMonthly = sumCategoryFromCosts(byCategory, 'other');
  const debtMinMonthly = debtPayments;

  const childTotals = [];
  if (childrenCosts && household?.children?.length) {
    Object.entries(childrenCosts).forEach(([key, fields]) => {
      const childIdx = parseInt(key.replace('child_', ''), 10);
      const child = household.children?.[childIdx];
      childTotals.push({
        key,
        name: (child?.displayName || `Child ${childIdx + 1}`).toUpperCase(),
        displayName: child?.displayName || t('onboarding.review.review.labels.childFallback', { n: childIdx + 1 }),
        total: childCostMonthlyTotal(fields),
        fields,
      });
    });
  }

  const healthMemberSummary = summarizeHealthMembers(health, household, t);

  return {
    currency,
    totalIncome,
    totalExpenses,
    monthlyBalance,
    allCosts,
    byCategory,
    transportMonthly,
    childrenMonthly,
    subsMonthly,
    otherMonthly,
    debtMinMonthly,
    childTotals,
    unconfirmedHealth: healthMemberSummary.incompleteNames,
    healthMemberSummary,
  };
}

/**
 * @param {Record<string, unknown>} allData
 * @param {ReturnType<typeof buildReviewFinancials>} financials
 * @param {(key: string, params?: object) => string} t
 */
export function buildReviewAlerts(allData, financials, t) {
  const alerts = [];
  const { totalIncome, monthlyBalance, unconfirmedHealth } = financials;

  if (totalIncome <= 0 && monthlyBalance < 0) {
    alerts.push({
      id: 'zero-income',
      message: t('onboarding.review.review.alerts.zeroIncome'),
      editRoute: buildReviewRowEditRoute('income', 'userIncome', {
        focusLabel: t('onboarding.review.review.labels.yourIncome'),
      }),
      editLabel: t('onboarding.review.review.alerts.reviewLink'),
    });
  }

  if (unconfirmedHealth.length > 0) {
    const names = unconfirmedHealth.join(', ');
    const health = allData.beaverr_health;
    const memberKey = firstUnconfirmedHealthMember(health);
    const h = allData.beaverr_household;
    alerts.push({
      id: 'health-unconfirmed',
      message: t('onboarding.review.review.alerts.healthUnconfirmed', {
        count: unconfirmedHealth.length,
        names,
      }),
      editRoute: buildReviewRowEditRoute('health', memberKey, {
        focusLabel: healthMemberLabel(memberKey, h, t),
      }),
      editLabel: t('onboarding.review.review.alerts.reviewLink'),
    });
  }

  if (totalIncome <= 0 && monthlyBalance >= 0) {
    alerts.push({
      id: 'zero-income-neutral',
      message: t('onboarding.review.review.alerts.zeroIncomeHint'),
      editRoute: buildReviewAlertEditRoute('zero-income-neutral'),
      editLabel: t('onboarding.review.review.alerts.reviewLink'),
    });
  }

  return alerts;
}
