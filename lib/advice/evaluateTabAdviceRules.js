import { evaluateAdviceRules } from './evaluateAdviceRules.js';
import { missingDaysInCycle } from '../budgetCycle.js';
import { asArray } from '../asArray.js';

/** @typedef {import('./buildTabSnapshot.js').TabAdviceKey} TabAdviceKey */

/**
 * @param {TabAdviceKey} tabKey
 * @param {object} snapshot
 * @param {object} ruleContext
 * @returns {import('./evaluateAdviceRules.js').TriggeredRule[]}
 */
export function evaluateTabAdviceRules(tabKey, snapshot, ruleContext = {}) {
  if (tabKey === 'home') {
    const rules = evaluateAdviceRules(snapshot, ruleContext);
    if (rules.length === 0) {
      const ledger = snapshot?.ledger || {};
      const incomeM = Number(ledger.income_m) || 0;
      const fixedM = Number(ledger.fixed_m) || 0;
      const debtM = Number(ledger.debt_m) || 0;
      const flexM = Number(ledger.flex_m) || 0;
      const hasData = incomeM > 0 || fixedM > 0 || debtM > 0 || flexM > 0;
      if (hasData) {
        rules.push({
          id: 'household_overview',
          severity: 'info',
          facts: {
            income_m: incomeM,
            fix_ratio: Number(ledger.fix_ratio) || 0,
            surplus_m: Number(ledger.surplus_m) || 0,
          },
        });
      }
    }
    return rules;
  }

  /** @type {import('./evaluateAdviceRules.js').TriggeredRule[]} */
  const rules = [];

  if (tabKey === 'income') {
    const sources = asArray(snapshot?.ledger?.income_sources).filter((s) => (s.m || 0) > 0);
    if (sources.length === 0) {
      rules.push({
        id: 'income_empty',
        severity: 'info',
        facts: { source_count: 0 },
      });
    } else if (sources.length === 1) {
      rules.push({
        id: 'single_income_household',
        severity: 'info',
        facts: { income_source_count: 1 },
      });
    } else {
      rules.push({
        id: 'income_sources_recorded',
        severity: 'info',
        facts: { source_count: sources.length },
      });
    }
    return rules;
  }

  if (tabKey === 'expenses') {
    const ratio = Number(snapshot?.ledger?.committed_ratio) || 0;
    if (ratio > 1) {
      rules.push({
        id: 'overcommitted',
        severity: 'critical',
        facts: { fix_ratio: ratio, threshold: 1 },
      });
    } else if (ratio > 0.8) {
      rules.push({
        id: 'fixed_cost_ratio_tight',
        severity: 'warning',
        facts: { fix_ratio: ratio, threshold: 0.8 },
      });
    } else if (ratio > 0) {
      rules.push({
        id: 'expenses_committed_summary',
        severity: 'info',
        facts: { committed_ratio: ratio },
      });
    }
    const housingRules = evaluateAdviceRules(
      buildMiniLedger(snapshot, ruleContext),
      ruleContext,
    ).filter((r) => r.id === 'housing_cost_share_elevated' || r.id === 'high_apr');
    return [...rules, ...housingRules];
  }

  if (tabKey === 'budget') {
    const surplusM = Number(snapshot?.ledger?.surplus_m) || 0;
    const fixRatio = Number(snapshot?.ledger?.fix_ratio) || 0;
    if (surplusM < 0) {
      rules.push({
        id: 'negative_surplus',
        severity: 'critical',
        facts: { surplus_m: surplusM },
      });
    }
    if (fixRatio > 0.8) {
      rules.push({
        id: 'fixed_cost_ratio_tight',
        severity: 'warning',
        facts: { fix_ratio: fixRatio, threshold: 0.8 },
      });
    }
    if (rules.length === 0) {
      rules.push({
        id: 'budget_flex_summary',
        severity: 'info',
        facts: { flex_m: Number(snapshot?.ledger?.flex_m) || 0 },
      });
    }
    return rules;
  }

  if (tabKey === 'savings') {
    const balance = Number(snapshot?.ledger?.savings_balance_m) || 0;
    const inflow = Number(snapshot?.ledger?.monthly_inflow_m) || 0;
    if (balance <= 0 && inflow <= 0) {
      rules.push({
        id: 'savings_empty',
        severity: 'info',
        facts: { balance_m: balance },
      });
    } else {
      rules.push({
        id: 'savings_balance_summary',
        severity: 'info',
        facts: { balance_m: balance, monthly_inflow_m: inflow },
      });
    }
    return rules;
  }

  if (tabKey === 'goals') {
    const behind = Number(snapshot?.goals?.behind_count) || 0;
    const active = Number(snapshot?.goals?.active_count) || 0;
    if (active === 0) {
      rules.push({
        id: 'goals_empty',
        severity: 'info',
        facts: { active_count: 0 },
      });
    } else if (behind > 0) {
      rules.push({
        id: 'goals_behind_pace',
        severity: 'warning',
        facts: { behind_count: behind, active_count: active },
      });
    } else if (ruleContext.goalGap && !ruleContext.goalGap.achievable) {
      rules.push({
        id: 'goal_at_risk',
        severity: 'warning',
        facts: { achievable: false },
      });
    } else {
      rules.push({
        id: 'goals_on_track',
        severity: 'info',
        facts: { active_count: active },
      });
    }
    return rules;
  }

  if (tabKey === 'tracker') {
    const { activeCycle, dailyLogs, budget } = ruleContext;
    const cyclesEnabled = budget?.cyclesEnabled === true;
    if (cyclesEnabled && activeCycle) {
      const unsetDays = missingDaysInCycle(activeCycle, dailyLogs);
      if (unsetDays.length > 0) {
        rules.push({
          id: 'tracker_needs_logging',
          severity: 'warning',
          facts: { unset_day_count: unsetDays.length },
        });
      } else {
        rules.push({
          id: 'tracker_on_track',
          severity: 'info',
          facts: { has_active_cycle: true },
        });
      }
    } else if (!dailyLogs?.length) {
      rules.push({
        id: 'tracker_no_logs',
        severity: 'info',
        facts: { log_count: 0 },
      });
    } else {
      rules.push({
        id: 'tracker_on_track',
        severity: 'info',
        facts: { log_count: dailyLogs.length },
      });
    }
    return rules;
  }

  if (tabKey === 'summary') {
    const deficit = Number(snapshot?.summary?.deficit_cycles) || 0;
    const total = Number(snapshot?.summary?.total_cycles) || 0;
    if (total === 0) {
      rules.push({
        id: 'summary_no_cycles',
        severity: 'info',
        facts: { total_cycles: 0 },
      });
    } else if (deficit > 0) {
      rules.push({
        id: 'summary_deficit_cycles',
        severity: 'warning',
        facts: { deficit_cycles: deficit, total_cycles: total },
      });
    } else {
      rules.push({
        id: 'summary_cycle_overview',
        severity: 'info',
        facts: { total_cycles: total },
      });
    }
    return rules;
  }

  if (tabKey === 'alerts') {
    const count = Number(snapshot?.alerts?.active_count) || 0;
    if (count === 0) {
      rules.push({
        id: 'alerts_empty',
        severity: 'info',
        facts: { active_count: 0 },
      });
    } else {
      rules.push({
        id: 'alerts_active',
        severity: snapshot?.alerts?.top_urgency === 'high' ? 'warning' : 'info',
        facts: {
          active_count: count,
          top_urgency: snapshot?.alerts?.top_urgency,
        },
      });
    }
    return rules;
  }

  return evaluateAdviceRules(snapshot, ruleContext);
}

function buildMiniLedger(snapshot, ruleContext) {
  const incomeM = Number(snapshot?.ledger?.income_m) || 0;
  const committed = Number(snapshot?.ledger?.committed_m) || 0;
  return {
    ledger: {
      income_m: incomeM,
      fix_ratio: incomeM > 0 ? committed / incomeM : 0,
      surplus_m: incomeM - committed,
    },
  };
}
