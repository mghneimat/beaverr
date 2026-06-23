import { loadHouseholdFinancials } from './householdBudget';
import { migrateBudgetPolicy } from './budgetMigration';
import { computeInsights } from './insights';
import { syncAlerts, getActiveAlerts } from './alerts';
import { effectiveSpendingBudget } from './finance';
import { getMonthlySavingsReservation } from './incomeGoals';
import { ensureMonthEndProcessed } from './monthEndRouting';
import { loadDailyLogs } from './dailyLog';
import { ensureCommittedBaseline } from './costReductionProgress';
import { processDayEndIfNeeded } from './jarRouting';
import { loadCycleStore, getActiveCycle } from './budgetCycle';
import { loadCycleAdjustments } from './cycleAdjustments';
import { loadOpenObligations } from './obligations';
import { syncBudgetActiveCycleId } from './cycleStart';
import { processGoalsPipeline } from './goals';
import { setData } from './storage';

/**
 * Load financials, insights, and synced alerts in one call for dashboard screens.
 * @param {(key: string, params?: object) => string} t
 */
export async function loadDashboardBundle(t) {
  const financials = await loadHouseholdFinancials(t);
  const { budget: migratedBudget, changed: budgetMigrated } = migrateBudgetPolicy(financials.budget);
  if (budgetMigrated) {
    await setData('beaverr_budget', migratedBudget);
  }
  const financialsWithBudget = budgetMigrated
    ? { ...financials, budget: migratedBudget }
    : financials;

  const goalsResult = await processGoalsPipeline({
    income: financialsWithBudget.income,
    debts: financialsWithBudget.debts || [],
    budget: financialsWithBudget.budget || {},
    t,
  });

  const financialsAfterGoals = {
    ...financialsWithBudget,
    income: goalsResult.income ?? financialsWithBudget.income,
    debts: goalsResult.debts,
    budget: goalsResult.budget,
    goals: goalsResult.goals,
  };

  const insights = computeInsights(financialsAfterGoals, goalsResult.goals);
  const committedBaseline = await ensureCommittedBaseline(financialsAfterGoals);
  const budgetWithBaseline = {
    ...(financialsAfterGoals.budget || {}),
    committedBaseline,
  };
  const deductSavingsGoal = financialsAfterGoals.budget?.deductSavingsGoal === true;
  const savingsGoalReservation = getMonthlySavingsReservation(
    financialsAfterGoals.income,
    insights.goalGap,
  );
  const savingsGoalDeduction = deductSavingsGoal ? savingsGoalReservation : 0;
  const effectiveMonthlyFlexible = effectiveSpendingBudget(
    financialsAfterGoals.monthlyFlexible,
    savingsGoalDeduction,
    deductSavingsGoal,
  );

  const cyclesEnabled = financialsAfterGoals.budget?.cyclesEnabled === true;
  const cycleStore = cyclesEnabled ? await loadCycleStore() : null;
  let activeCycle = cycleStore ? getActiveCycle(cycleStore) : null;

  let closedBudget = financialsAfterGoals.budget;
  let closedIncome = financialsAfterGoals.income;

  if (!cyclesEnabled) {
    const monthEnd = await ensureMonthEndProcessed({
      budget: financialsAfterGoals.budget,
      income: financialsAfterGoals.income,
      effectiveMonthlyFlexible,
    });
    closedBudget = monthEnd.budget;
    closedIncome = monthEnd.income;
  } else if (cycleStore && closedBudget) {
    closedBudget = await syncBudgetActiveCycleId(
      closedBudget,
      cycleStore.activeCycleId,
    );
    activeCycle = getActiveCycle(cycleStore);
  }

  const dailyLogs = await loadDailyLogs();
  const cycleAdjustments = cyclesEnabled ? await loadCycleAdjustments() : [];
  const openObligations = await loadOpenObligations();

  const { budget: dayProcessedBudget, income: dayProcessedIncome, closedDays } = processDayEndIfNeeded({
    budget: closedBudget ?? financialsAfterGoals.budget,
    income: closedIncome ?? financialsAfterGoals.income,
    effectiveMonthlyFlexible,
    dailyLogs,
    activeCycle,
    cyclesEnabled,
    cycleAdjustments,
  });

  if (closedDays.length > 0) {
    await setData('beaverr_budget', dayProcessedBudget);
    if (dayProcessedIncome) {
      await setData('beaverr_income', dayProcessedIncome);
    }
  }

  const baseBudget = closedDays.length > 0 ? dayProcessedBudget : (closedBudget ?? budgetWithBaseline);
  const baseIncome = closedDays.length > 0 ? (dayProcessedIncome ?? closedIncome) : closedIncome;
  const finalBudget = { ...baseBudget, committedBaseline };

  const enrichedFinancials = {
    ...financialsAfterGoals,
    income: baseIncome ?? financialsAfterGoals.income,
    budget: { ...finalBudget, committedBaseline },
    deductSavingsGoal,
    savingsGoalReservation,
    savingsGoalDeduction,
    effectiveMonthlyFlexible,
    budgetSavingsShift: financialsAfterGoals.budgetSavingsShift || 0,
    goals: goalsResult.goals,
    dailyLogs,
    cyclesEnabled,
    cycleStore,
    activeCycle,
    cycleAdjustments,
    openObligations,
  };
  const alerts = await syncAlerts({
    subs: financialsAfterGoals.sections.subs,
    health: financialsAfterGoals.sections.health,
    debts: financialsAfterGoals.debts,
    transport: financialsAfterGoals.sections.transport,
    sections: financialsAfterGoals.sections,
    goalAlerts: goalsResult.goalAlertRecords,
  }, t);

  return {
    financials: enrichedFinancials,
    insights,
    alerts,
    activeAlerts: getActiveAlerts(alerts),
    goals: goalsResult.goals,
    pendingCelebrations: goalsResult.pendingCelebrations,
  };
}
