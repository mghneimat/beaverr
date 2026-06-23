import { debtPayoff, toMonthly } from './finance';
import { categoryMonthlyTotal, topCostCategories, STREAMING_SERVICES } from './householdCosts';
import { computeGoalGap } from './goalGap';
import { daysUntil, parseAlertDate } from './alerts';
import { getHeadlineAction } from './insightActions';
import { missingDaysInCycle } from './budgetCycle';
import { getMonthlyPlannedSavings } from './savingsProjection';

export { computeGoalGap } from './goalGap';

const HIGH_FIXED_RATIO = 0.8;
const HIGH_APR = 20;
const STREAMING_COUNT_THRESHOLD = 3;
const SUB_BUDGET_RATIO = 0.05;

/**
 * @param {import('./householdBudget').HouseholdFinancials} financials
 * @returns {number}
 */
function recurringCommitmentMonthly(financials) {
  return (financials.recurringCommitments || []).reduce((sum, item) => sum + item.monthlyAmount, 0);
}

/**
 * @param {import('./householdBudget').HouseholdFinancials} financials
 * @param {import('./schema').Goal[]} [goals]
 */
export function computeInsights(financials, goals = []) {
  const totalIncome = financials.totalIncome || 0;
  const fixedLoad = financials.fixedCosts + financials.debtPayments;
  const fixedCostRatio = totalIncome > 0 ? fixedLoad / totalIncome : 0;
  const surplusMonthly = totalIncome - fixedLoad - financials.monthlyFlexible;
  const recurringMonthly = recurringCommitmentMonthly(financials);
  const recurringCommitmentRatio = totalIncome > 0 ? recurringMonthly / totalIncome : 0;

  const topCats = topCostCategories(financials.byCategory, 3).map((cat) => ({
    key: cat.category,
    label: cat.label,
    monthly: cat.monthlyTotal,
    pctOfIncome: totalIncome > 0 ? cat.monthlyTotal / totalIncome : 0,
  }));

  const subCategory = financials.byCategory.find((c) => c.category === 'subscriptions');
  const subscriptionMonthlyTotal = subCategory ? categoryMonthlyTotal(subCategory) : 0;
  const subscriptionCount = (financials.sections?.subs || []).filter((s) => s.cost).length;

  const streamingCount = (financials.sections?.subs || []).filter(
    (s) => s.cost && STREAMING_SERVICES.includes(s.name),
  ).length;

  const highAprDebts = (financials.debts || [])
    .map((debt, idx) => {
      const apr = parseFloat(debt.apr || 0);
      if (apr <= HIGH_APR) return null;
      const balance = parseFloat(debt.balance || 0);
      const payment = parseFloat(debt.minPayment || 0);
      const payoff = debtPayoff(balance, payment, apr);
      return {
        idx,
        balance,
        apr,
        payoffMonths: payoff.months,
        type: debt.type || 'other',
      };
    })
    .filter(Boolean);

  const goalGap = computeGoalGap(financials, goals);

  const renewalsSoon = (financials.recurringCommitments || [])
    .filter((item) => item.renewalDate)
    .map((item) => {
      const date = parseAlertDate(item.renewalDate);
      if (!date) return null;
      const days = daysUntil(date);
      if (days < 0 || days > 30) return null;
      return { label: item.label, days };
    })
    .filter(Boolean);

  const sectionSignals = buildSectionSignals(financials, {
    totalIncome,
    subscriptionCount,
    subscriptionMonthlyTotal,
    streamingCount,
    renewalsSoon,
    highAprDebts,
    goalGap,
    fixedCostRatio,
    surplusMonthly,
  });

  let headlineKey = 'dashboard.insights.headline.balanced';
  const headlineParams = {};

  if (fixedCostRatio > 1) {
    headlineKey = 'dashboard.insights.headline.overcommitted';
    headlineParams.pct = Math.round(fixedCostRatio * 100);
  } else if (fixedCostRatio > HIGH_FIXED_RATIO) {
    headlineKey = 'dashboard.insights.headline.tight';
    headlineParams.pct = Math.round(fixedCostRatio * 100);
  } else if (topCats[0]) {
    headlineKey = 'dashboard.insights.headline.topCategory';
    headlineParams.category = topCats[0].label;
    headlineParams.pct = Math.round(topCats[0].pctOfIncome * 100);
  }

  return {
    fixedCostRatio,
    surplusMonthly,
    recurringCommitmentRatio,
    recurringMonthly,
    topCategories: topCats,
    subscriptionCount,
    subscriptionMonthlyTotal,
    streamingCount,
    highAprDebts,
    goalGap,
    renewalsSoon,
    sectionSignals,
    headlineKey,
    headlineParams,
    flags: {
      overcommitted: fixedCostRatio > 1,
      tight: fixedCostRatio > HIGH_FIXED_RATIO,
      negativeSurplus: surplusMonthly < 0,
      manyStreaming: streamingCount >= STREAMING_COUNT_THRESHOLD,
      subBudgetHeavy: financials.monthlyFlexible > 0
        && subscriptionMonthlyTotal / financials.monthlyFlexible > SUB_BUDGET_RATIO,
      goalAtRisk: goalGap && !goalGap.achievable,
    },
  };
}

/**
 * @param {import('./householdBudget').HouseholdFinancials} financials
 * @param {object} ctx
 */
function buildSectionSignals(financials, ctx) {
  const pct = (monthly) => (ctx.totalIncome > 0 ? monthly / ctx.totalIncome : 0);

  const housingCat = financials.byCategory.find((c) => c.category === 'housing');
  const transportCat = financials.byCategory.find((c) => c.category === 'transport');
  const healthCat = financials.byCategory.find((c) => c.category === 'health');
  const childrenCat = financials.byCategory.find((c) => c.category === 'children');
  const petsCat = financials.byCategory.find((c) => c.category === 'pets');
  const subsCat = financials.byCategory.find((c) => c.category === 'subscriptions');
  const otherCat = financials.byCategory.find((c) => c.category === 'other');

  const userMonthly = toMonthly(financials.income?.amount || 0, financials.income?.frequency || 'monthly');
  const partnerMonthly = toMonthly(
    financials.income?.partnerAmount || 0,
    financials.income?.partnerFrequency || 'monthly',
  );

  return {
    income: {
      monthly: financials.totalIncome,
      pctOfIncome: 1,
      flags: [],
      sources: { userMonthly, partnerMonthly, otherCount: (financials.income?.otherIncomeRows || []).length },
    },
    housing: {
      monthly: housingCat ? categoryMonthlyTotal(housingCat) : 0,
      pctOfIncome: pct(housingCat ? categoryMonthlyTotal(housingCat) : 0),
      flags: housingCat && pct(categoryMonthlyTotal(housingCat)) > 0.35 ? ['high_share'] : [],
    },
    transport: {
      monthly: transportCat ? categoryMonthlyTotal(transportCat) : 0,
      pctOfIncome: pct(transportCat ? categoryMonthlyTotal(transportCat) : 0),
      flags: [],
    },
    health: {
      monthly: healthCat ? categoryMonthlyTotal(healthCat) : 0,
      pctOfIncome: pct(healthCat ? categoryMonthlyTotal(healthCat) : 0),
      flags: [],
    },
    children: {
      monthly: childrenCat ? categoryMonthlyTotal(childrenCat) : 0,
      pctOfIncome: pct(childrenCat ? categoryMonthlyTotal(childrenCat) : 0),
      flags: [],
    },
    pets: {
      monthly: petsCat ? categoryMonthlyTotal(petsCat) : 0,
      pctOfIncome: pct(petsCat ? categoryMonthlyTotal(petsCat) : 0),
      flags: [],
    },
    subscriptions: {
      monthly: ctx.subscriptionMonthlyTotal,
      pctOfIncome: pct(ctx.subscriptionMonthlyTotal),
      count: ctx.subscriptionCount,
      streamingCount: ctx.streamingCount,
      renewalsSoon: ctx.renewalsSoon.filter((r) => (
        (financials.recurringCommitments || []).some((c) => c.kind === 'subscription' && c.label === r.label)
      )),
      flags: [
        ...(ctx.streamingCount >= STREAMING_COUNT_THRESHOLD ? ['many_streaming'] : []),
        ...(ctx.renewalsSoon.length > 0 ? ['renewals_soon'] : []),
      ],
    },
    other: {
      monthly: otherCat ? categoryMonthlyTotal(otherCat) : 0,
      pctOfIncome: pct(otherCat ? categoryMonthlyTotal(otherCat) : 0),
      flags: [],
    },
    debts: {
      monthly: financials.debtPayments,
      pctOfIncome: pct(financials.debtPayments),
      count: (financials.debts || []).length,
      highAprCount: ctx.highAprDebts.length,
      flags: ctx.highAprDebts.length > 0 ? ['high_apr'] : [],
    },
    budget: {
      monthly: financials.monthlyFlexible,
      pctOfIncome: pct(financials.monthlyFlexible),
      surplus: ctx.surplusMonthly,
      flags: ctx.surplusMonthly < 0 ? ['negative_surplus'] : [],
    },
    goals: {
      monthly: ctx.goalGap?.monthlyRequired || 0,
      achievable: ctx.goalGap?.achievable ?? null,
      gap: ctx.goalGap?.gap || 0,
      flags: ctx.goalGap && !ctx.goalGap.achievable ? ['goal_at_risk'] : [],
    },
  };
}

/**
 * Rule-based section insight for InsightSlot (Phase 4 replaces with AI narrative).
 * @param {string} sectionKey
 * @param {ReturnType<typeof computeInsights>} insights
 * @param {(key: string, params?: object) => string} t
 * @returns {string|null}
 */
export function getSectionInsight(sectionKey, insights, t) {
  const signals = insights.sectionSignals[sectionKey];
  if (!signals) return null;

  if (sectionKey === 'subscriptions') {
    if (signals.flags.includes('many_streaming')) {
      return t('dashboard.insights.sections.subscriptions.manyStreaming', { count: signals.streamingCount });
    }
    if (signals.flags.includes('renewals_soon')) {
      return t('dashboard.insights.sections.subscriptions.renewalsSoon', { count: signals.renewalsSoon.length });
    }
    if (signals.count > 0) {
      return t('dashboard.insights.sections.subscriptions.summary', {
        count: signals.count,
        pct: Math.round(signals.pctOfIncome * 100),
      });
    }
    return t('dashboard.insights.sections.subscriptions.empty');
  }

  if (sectionKey === 'debts') {
    if (signals.flags.includes('high_apr')) {
      return t('dashboard.insights.sections.debts.highApr', { count: signals.highAprCount });
    }
    if (signals.count > 0) {
      return t('dashboard.insights.sections.debts.summary', { count: signals.count });
    }
    return t('dashboard.insights.sections.debts.empty');
  }

  if (sectionKey === 'goals') {
    if (signals.flags.includes('goal_at_risk')) {
      return t('dashboard.insights.sections.goals.atRisk');
    }
    if (insights.goalGap && insights.goalGap.achievable) {
      return t('dashboard.insights.sections.goals.onTrack');
    }
    return t('dashboard.insights.sections.goals.empty');
  }

  if (sectionKey === 'budget') {
    if (signals.flags.includes('negative_surplus')) {
      return t('dashboard.insights.sections.budget.negativeSurplus');
    }
    return t('dashboard.insights.sections.budget.summary', {
      pct: Math.round(signals.pctOfIncome * 100),
    });
  }

  if (sectionKey === 'income') {
    if (signals.monthly <= 0) return t('dashboard.insights.sections.income.empty');
    const sourceCount = (signals.sources?.otherCount || 0)
      + (signals.sources?.userMonthly > 0 ? 1 : 0)
      + (signals.sources?.partnerMonthly > 0 ? 1 : 0);
    return t('dashboard.insights.sections.income.summary', { count: sourceCount });
  }

  if (sectionKey === 'housing' && signals.flags.includes('high_share')) {
    return t('dashboard.insights.sections.housing.highShare', { pct: Math.round(signals.pctOfIncome * 100) });
  }

  if (signals.monthly > 0) {
    return t('dashboard.insights.sections.generic.summary', {
      pct: Math.round(signals.pctOfIncome * 100),
    });
  }

  return t(`dashboard.insights.sections.${sectionKey}.empty`);
}

/**
 * Budget tab insight — lead + detail copy and navigation action.
 * @param {ReturnType<typeof computeInsights>} insights
 * @param {(key: string, params?: object) => string} t
 * @param {(monthly: number) => string} formatAmount
 * @returns {{ lead: string, detail: string, ctaKey: string, route: string }|null}
 */
export function getBudgetSectionInsight(insights, t, formatAmount) {
  const signals = insights?.sectionSignals?.budget;
  if (!signals) return null;

  const pct = Math.round(signals.pctOfIncome * 100);
  const topCat = insights.topCategories?.[0];

  if (signals.flags.includes('negative_surplus')) {
    return {
      lead: t('dashboard.insights.sections.budget.negativeSurplusLead'),
      detail: t('dashboard.insights.sections.budget.negativeSurplusDetail'),
      ctaKey: 'dashboard.insights.actions.reviewBudget',
      route: 'budget',
    };
  }

  const lead = pct < 20
    ? t('dashboard.insights.sections.budget.summaryLow', { pct })
    : t('dashboard.insights.sections.budget.summaryLead', { pct });

  const detail = topCat
    ? t('dashboard.insights.sections.budget.detailTopCategory', {
      category: topCat.label,
      amount: formatAmount(topCat.monthly),
    })
    : t('dashboard.insights.sections.budget.detailGeneric');

  return {
    lead,
    detail,
    ctaKey: 'dashboard.insights.actions.seeSuggestions',
    route: 'costs',
  };
}

/**
 * @param {ReturnType<typeof computeInsights>} insights
 * @param {(key: string, params?: object) => string} t
 * @returns {string}
 */
export function getHeadlineInsight(insights, t) {
  return t(insights.headlineKey, insights.headlineParams);
}

/**
 * @param {'home'|'income'|'expenses'|'budget'|'summary'|'goals'|'savings'|'tracker'|'alerts'} tabKey
 * @param {ReturnType<typeof computeInsights>} insights
 * @param {(key: string, params?: object) => string} t
 * @param {{
 *   formatAmount?: (monthly: number) => string,
 *   financials?: import('./householdBudget').HouseholdFinancials,
 *   alerts?: import('./alerts').AlertRecord[],
 *   savingsBalance?: number,
 * }} [helpers]
 * @returns {{ paragraphs: string[], ctaLabel?: string, route?: string }|null}
 */
export function getTabInsight(tabKey, insights, t, helpers = {}) {
  const { formatAmount, financials, alerts = [], savingsBalance = 0 } = helpers;

  if (tabKey === 'home') {
    const headline = getHeadlineInsight(insights, t);
    const action = getHeadlineAction(insights);
    return {
      paragraphs: [headline],
      ctaLabel: t(action.ctaKey),
      route: action.route,
    };
  }

  if (tabKey === 'income') {
    const text = getSectionInsight('income', insights, t);
    return text ? { paragraphs: [text] } : null;
  }

  if (tabKey === 'expenses' || tabKey === 'summary') {
    return { paragraphs: [getHeadlineInsight(insights, t)] };
  }

  if (tabKey === 'budget') {
    if (!formatAmount) return null;
    const budgetInsight = getBudgetSectionInsight(insights, t, formatAmount);
    if (!budgetInsight) return null;
    return {
      paragraphs: [budgetInsight.lead, budgetInsight.detail].filter(Boolean),
      ctaLabel: t(budgetInsight.ctaKey),
      route: budgetInsight.route,
    };
  }

  if (tabKey === 'goals') {
    const portfolioGoals = helpers.goals || [];
    const active = portfolioGoals.filter((g) => g.lifecycleStatus === 'active');
    if (!active.length) {
      return { paragraphs: [t('dashboard.insights.sections.goals.empty')] };
    }
    const behind = active.filter((g) => g.paceStatus === 'behind' || g.paceStatus === 'regressed');
    if (behind.length > 0) {
      return {
        paragraphs: [
          t('dashboard.insights.sections.goals.portfolioBehind', { count: behind.length }),
        ],
      };
    }
    if (insights.goalGap && !insights.goalGap.achievable) {
      return { paragraphs: [t('dashboard.insights.sections.goals.atRisk')] };
    }
    return {
      paragraphs: [
        t('dashboard.insights.sections.goals.portfolioOnTrack', { count: active.length }),
      ],
    };
  }

  if (tabKey === 'savings') {
    return getSavingsTabInsight(savingsBalance, financials, insights, t, formatAmount);
  }

  if (tabKey === 'tracker') {
    return getTrackerTabInsight(financials, t);
  }

  if (tabKey === 'alerts') {
    return getAlertsTabInsight(alerts, t);
  }

  return null;
}

/**
 * @param {number} savingsBalance
 * @param {import('./householdBudget').HouseholdFinancials|undefined} financials
 * @param {ReturnType<typeof computeInsights>} insights
 * @param {(key: string, params?: object) => string} t
 * @param {(monthly: number) => string} [formatAmount]
 */
function getSavingsTabInsight(savingsBalance, financials, insights, t, formatAmount) {
  const balance = Number(savingsBalance) || 0;
  if (balance <= 0) {
    return { paragraphs: [t('dashboard.insights.sections.savings.empty')] };
  }

  const amountLabel = formatAmount ? formatAmount(balance) : String(balance);
  const monthlyInflow = financials
    ? getMonthlyPlannedSavings(financials, insights?.goalGap)
    : 0;

  if (monthlyInflow > 0 && formatAmount) {
    return {
      paragraphs: [
        t('dashboard.insights.sections.savings.withInflow', {
          amount: amountLabel,
          inflow: formatAmount(monthlyInflow),
        }),
      ],
    };
  }

  return {
    paragraphs: [t('dashboard.insights.sections.savings.summary', { amount: amountLabel })],
  };
}

/**
 * @param {import('./householdBudget').HouseholdFinancials|undefined} financials
 * @param {(key: string, params?: object) => string} t
 */
function getTrackerTabInsight(financials, t) {
  if (!financials) {
    return { paragraphs: [t('dashboard.insights.sections.tracker.empty')] };
  }

  const budget = financials.budget || {};
  const dailyLogs = financials.dailyLogs || [];
  const cyclesEnabled = budget.cyclesEnabled === true;
  const activeCycle = financials.activeCycle ?? null;

  if (cyclesEnabled && activeCycle) {
    const unsetDays = missingDaysInCycle(activeCycle, dailyLogs);
    if (unsetDays.length > 0) {
      return {
        paragraphs: [
          t('dashboard.insights.sections.tracker.needsLogging', { count: unsetDays.length }),
        ],
      };
    }
    return { paragraphs: [t('dashboard.insights.sections.tracker.onTrack')] };
  }

  if (!dailyLogs.length) {
    return { paragraphs: [t('dashboard.insights.sections.tracker.empty')] };
  }

  return { paragraphs: [t('dashboard.insights.sections.tracker.onTrack')] };
}

/**
 * @param {import('./alerts').AlertRecord[]} alerts
 * @param {(key: string, params?: object) => string} t
 */
function getAlertsTabInsight(alerts, t) {
  const active = (alerts || []).filter((alert) => alert.status === 'active');
  if (!active.length) {
    return { paragraphs: [t('dashboard.insights.sections.alerts.empty')] };
  }

  const urgencyRank = { high: 0, medium: 1, low: 2 };
  const sorted = [...active].sort(
    (a, b) => (urgencyRank[a.urgency] ?? 2) - (urgencyRank[b.urgency] ?? 2),
  );
  const topUrgency = sorted[0]?.urgency || 'low';
  const urgencyKey = `dashboard.insights.sections.alerts.urgency${topUrgency.charAt(0).toUpperCase()}${topUrgency.slice(1)}`;

  return {
    paragraphs: [
      t('dashboard.insights.sections.alerts.summary', {
        count: active.length,
        urgency: t(urgencyKey),
      }),
    ],
  };
}
