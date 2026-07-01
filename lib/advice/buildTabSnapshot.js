import { committedMonthlyLoad } from '../finance.js';
import { buildFinancialSnapshot } from './buildFinancialSnapshot.js';
import { computeSummaryCycleCounts } from '../summaryCycleStats.js';
import { getMonthlyPlannedSavings } from '../savingsProjection.js';
import { asArray } from '../asArray.js';
import { categoryMonthlyTotal } from '../householdCosts.js';

/**
 * @typedef {'home'|'income'|'expenses'|'budget'|'summary'|'goals'|'savings'|'tracker'|'alerts'} TabAdviceKey
 */

/**
 * @param {TabAdviceKey} tabKey
 * @param {{
 *   financials: import('../householdBudget').HouseholdFinancials,
 *   locale: string,
 *   helpers?: {
 *     goals?: object[],
 *     alerts?: import('../alerts').AlertRecord[],
 *     savingsBalance?: number,
 *     goalGap?: object|null,
 *   },
 * }} input
 * @returns {{ snapshot: object, ruleContext: object }}
 */
export function buildTabSnapshot(tabKey, { financials, locale, helpers = {} }) {
  if (tabKey === 'home') {
    const snapshot = buildFinancialSnapshot({ financials, locale });
    return {
      snapshot: { ...snapshot, tab_key: 'home' },
      ruleContext: {
        debts: financials.debts,
        byCategory: financials.byCategory,
        financialRisks: financials.financialRisks,
        sections: financials.sections,
      },
    };
  }

  const fullSnapshot = buildFinancialSnapshot({ financials, locale });
  const base = {
    v: 1,
    locale,
    tab_key: tabKey,
    location: fullSnapshot.location,
    household: fullSnapshot.household,
    currency: financials.currencyCode || 'CZK',
  };

  if (tabKey === 'income') {
    return {
      snapshot: {
        ...base,
        ledger: {
          income_m: fullSnapshot.ledger.income_m,
          income_sources: fullSnapshot.ledger.income_sources,
        },
      },
      ruleContext: { tabKey, incomeSources: fullSnapshot.ledger.income_sources },
    };
  }

  if (tabKey === 'expenses') {
    const incomeM = Math.round(financials.totalIncome || 0);
    const committed = Math.round(committedMonthlyLoad(financials));
    const fixedM = Math.round(financials.fixedCosts || 0);
    const recurringM = Math.max(0, committed - fixedM);
    const topCategories = asArray(financials.byCategory)
      .map((cat) => ({
        category: cat.category,
        monthly_m: Math.round(categoryMonthlyTotal(cat)),
      }))
      .filter((row) => row.monthly_m > 0)
      .sort((a, b) => b.monthly_m - a.monthly_m)
      .slice(0, 5);

    return {
      snapshot: {
        ...base,
        ledger: {
          income_m: incomeM,
          committed_m: committed,
          fixed_m: fixedM,
          recurring_m: recurringM,
          committed_ratio: incomeM > 0 ? roundRatio(committed / incomeM) : 0,
        },
        categories: topCategories,
      },
      ruleContext: {
        tabKey,
        byCategory: financials.byCategory,
        debts: financials.debts,
      },
    };
  }

  if (tabKey === 'budget') {
    const budget = financials.budget || {};
    return {
      snapshot: {
        ...base,
        ledger: {
          income_m: fullSnapshot.ledger.income_m,
          flex_m: fullSnapshot.ledger.flex_m,
          surplus_m: fullSnapshot.ledger.surplus_m,
          fix_ratio: fullSnapshot.ledger.fix_ratio,
        },
        budget: {
          rollover_strategy: budget.rolloverStrategy || 'free',
          spending_ratio: budget.budgetSpendingRatio ?? null,
          cycles_enabled: budget.cyclesEnabled === true,
        },
      },
      ruleContext: { tabKey, ...fullSnapshot.ledger },
    };
  }

  if (tabKey === 'savings') {
    const balance = Math.round(Number(helpers.savingsBalance) || 0);
    const monthlyInflow = Math.round(
      getMonthlyPlannedSavings(financials, helpers.goalGap ?? null),
    );
    return {
      snapshot: {
        ...base,
        ledger: { savings_balance_m: balance, monthly_inflow_m: monthlyInflow },
      },
      ruleContext: { tabKey, balance, monthlyInflow },
    };
  }

  if (tabKey === 'goals') {
    const goals = asArray(helpers.goals);
    const active = goals.filter((g) => g.lifecycleStatus === 'active');
    const behind = active.filter(
      (g) => g.paceStatus === 'behind' || g.paceStatus === 'regressed',
    );
    return {
      snapshot: {
        ...base,
        goals: {
          active_count: active.length,
          behind_count: behind.length,
          archived_count: goals.filter((g) => g.lifecycleStatus === 'archived').length,
        },
      },
      ruleContext: { tabKey, goals: active, goalGap: helpers.goalGap },
    };
  }

  if (tabKey === 'tracker') {
    const budget = financials.budget || {};
    const activeCycle = financials.activeCycle ?? null;
    const dailyLogs = financials.dailyLogs || [];
    return {
      snapshot: {
        ...base,
        tracker: {
          cycles_enabled: budget.cyclesEnabled === true,
          has_active_cycle: Boolean(activeCycle),
          cycle_started_at: activeCycle?.startedAt ?? null,
          daily_log_count: dailyLogs.length,
        },
      },
      ruleContext: {
        tabKey,
        financials,
        activeCycle,
        dailyLogs,
        budget,
      },
    };
  }

  if (tabKey === 'summary') {
    const counts = computeSummaryCycleCounts(financials.cycleStore);
    return {
      snapshot: {
        ...base,
        summary: {
          total_cycles: counts.total,
          closed_count: counts.closedCount,
          in_progress: counts.inProgress,
          saved_cycles: counts.savedMoney,
          deficit_cycles: counts.deficit,
        },
      },
      ruleContext: { tabKey, counts, financials },
    };
  }

  if (tabKey === 'alerts') {
    const alerts = asArray(helpers.alerts).filter((a) => a.status === 'active');
    const urgencyRank = { high: 0, medium: 1, low: 2 };
    const sorted = [...alerts].sort(
      (a, b) => (urgencyRank[a.urgency] ?? 2) - (urgencyRank[b.urgency] ?? 2),
    );
    return {
      snapshot: {
        ...base,
        alerts: {
          active_count: alerts.length,
          top_urgency: sorted[0]?.urgency ?? null,
        },
      },
      ruleContext: { tabKey, alerts },
    };
  }

  return buildTabSnapshot('home', { financials, locale, helpers });
}

/**
 * @param {object} snapshot
 * @returns {string}
 */
export function hashTabSnapshot(snapshot) {
  return JSON.stringify(snapshot);
}

function roundRatio(value) {
  return Math.round(value * 100) / 100;
}
