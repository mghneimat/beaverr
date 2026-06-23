/**
 * Review screen formatting helpers and row builders.
 */

import { formatCurrency, parseMoneyAmount, toMonthly } from '../finance';
import { getHealthMemberMonthlyAmount } from '../healthInsuranceBudget';
import { restoreGoalSelection, hasAnyGoalIntent } from '../incomeGoals';

export const REVIEW_PERIOD_KEYS = {
  monthly: 'onboarding.review.review.format.perMonth',
  weekly: 'onboarding.review.review.format.perWeek',
  daily: 'onboarding.review.review.format.perDay',
  fortnightly: 'onboarding.review.review.format.perFortnight',
  quarterly: 'onboarding.review.review.format.perQuarter',
  annual: 'onboarding.review.review.format.perYear',
};

export function reviewRow(sectionId, editKey, label, value, extra = {}) {
  return {
    sectionId,
    key: `${sectionId}:${editKey}`,
    editKey,
    editable: true,
    label,
    value,
    ...extra,
  };
}

export function reviewReadOnly(sectionId, key, label, value, extra = {}) {
  return {
    sectionId,
    key: `${sectionId}:${key}`,
    editKey: null,
    editable: false,
    label,
    value,
    ...extra,
  };
}

export function reviewPeriodSuffix(frequency, t) {
  const key = REVIEW_PERIOD_KEYS[(frequency || 'monthly').toLowerCase()];
  return t(key || REVIEW_PERIOD_KEYS.monthly);
}

export function formatRecurringAmount(amount, currency, frequency, t) {
  const parsed = parseMoneyAmount(amount);
  if (parsed == null) return '—';
  return `${formatCurrency(parsed, currency)}${reviewPeriodSuffix(frequency, t)}`;
}

export function formatMonthly(amount, currency, t) {
  return formatRecurringAmount(amount, currency, 'monthly', t);
}

export function monthlyAmount(amount, frequency = 'monthly') {
  return toMonthly(amount, frequency || 'monthly');
}

/** @param {number} amount @param {string} currency @param {(key: string) => string} t */
export function formatReviewMonthlyAmount(amount, currency, t) {
  return formatMonthly(amount, currency, t);
}

/** @param {number} amount @param {string} currency */
export function formatReviewMoney(amount, currency) {
  return formatCurrency(amount, currency);
}

export function incomeGoalsSummary(inc, t) {
  if (!inc) return '—';
  const { goalIntents } = restoreGoalSelection(inc);
  if (!hasAnyGoalIntent(goalIntents)) return '—';
  const parts = [];
  if (goalIntents.clarity) parts.push(t('onboarding.strategy.goalIntents.intentClarity'));
  if (goalIntents.spendLess) parts.push(t('onboarding.strategy.goalIntents.intentSpendLess'));
  if (goalIntents.buildMore) parts.push(t('onboarding.strategy.goalIntents.intentBuildMore'));
  return parts.join(t('onboarding.review.review.format.listSeparator'));
}

export function healthMemberLabel(key, household, t) {
  if (key === 'user') return t('onboarding.health.you');
  if (key === 'partner') return household?.partnerName || t('onboarding.review.review.labels.partner');
  if (key.startsWith('child_')) {
    const childIdx = parseInt(key.replace('child_', ''), 10);
    const child = household?.children?.[childIdx];
    return child?.displayName || `${t('onboarding.health.child')} ${childIdx + 1}`;
  }
  return key;
}

function formatHealthPremiumDisplay(member, currency, t) {
  const premium = parseMoneyAmount(member.premium);
  if (!premium || premium <= 0) return null;

  const freq = (member.frequency || 'monthly').toLowerCase();
  if (freq === 'custom') {
    const months = parseMoneyAmount(member.customFrequencyMonths);
    if (months) {
      return t('onboarding.review.review.format.everyNMonths', {
        amount: formatCurrency(premium, currency),
        count: months,
      });
    }
  }

  return formatRecurringAmount(premium, currency, freq, t);
}

export function healthMemberStatus(val, currency, t) {
  if (val?.skipped) return t('common.skipped');
  if (!val?.confirmed) return t('onboarding.review.review.labels.notConfirmed');
  if (val.coverage === 'employer') return t('onboarding.review.review.labels.covered');
  if (val.coverage === 'private') {
    const monthly = getHealthMemberMonthlyAmount(val);
    if (monthly > 0) return formatMonthly(monthly, currency, t);
    const premiumDisplay = formatHealthPremiumDisplay(val, currency, t);
    if (premiumDisplay) return premiumDisplay;
    return t('onboarding.review.review.labels.private');
  }
  return t('onboarding.review.review.labels.notConfirmed');
}

export function summarizeHealthMembers(health, household, t) {
  const incompleteNames = [];
  let skippedCount = 0;
  let unconfirmedCount = 0;
  if (!health || typeof health !== 'object') {
    return { incompleteNames, skippedCount, unconfirmedCount };
  }
  Object.entries(health).forEach(([key, val]) => {
    if (val?.confirmed) return;
    incompleteNames.push(healthMemberLabel(key, household, t));
    if (val?.skipped) skippedCount += 1;
    else unconfirmedCount += 1;
  });
  return { incompleteNames, skippedCount, unconfirmedCount };
}

export function firstUnconfirmedHealthMember(health) {
  if (!health || typeof health !== 'object') return 'user';
  const entry = Object.entries(health).find(([, val]) => !val?.confirmed);
  return entry?.[0] || 'user';
}

export function childCostMonthlyTotal(fields) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return 0;
  return Object.values(fields).reduce((sum, val) => {
    if (!val?.amount) return sum;
    return sum + monthlyAmount(val.amount, val.frequency);
  }, 0);
}

export function buildHealthSectionSubtitle(financials, t) {
  const { skippedCount, unconfirmedCount } = financials.healthMemberSummary;
  const total = skippedCount + unconfirmedCount;
  if (total === 0) return t('onboarding.review.review.subtitles.healthConfirmed');
  if (skippedCount > 0 && unconfirmedCount === 0) {
    return t('onboarding.review.review.subtitles.healthSkipped', { count: skippedCount });
  }
  if (unconfirmedCount > 0 && skippedCount === 0) {
    return t('onboarding.review.review.subtitles.healthUnconfirmed', { count: unconfirmedCount });
  }
  return t('onboarding.review.review.subtitles.healthIncomplete', { count: total });
}
