import { useMemo, useState } from 'react';
import { buildTrackerPreviews } from '../../../lib/trackerPreview';
import { getLastClosedCycle, isCycleBackfillPending } from '../../../lib/budgetCycle';
import SpendingPaceBanner from '../SpendingPaceBanner';
import CyclePaceCard from './CyclePaceCard';
import CycleControlSection from './CycleControlSection';
import StartCycleWizard from './StartCycleWizard';
import CloseCycleWizard from './CloseCycleWizard';

export default function CycleTrackerShell({
  bundle,
  currency,
  calendarSlot = null,
  footerSlot = null,
  onGoBackAndLog,
  onLogDueDay,
}) {
  const [startOpen, setStartOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const budget = bundle.financials.budget || {};
  const activeCycle = bundle.financials.activeCycle;
  const cycleStore = bundle.financials.cycleStore;
  const dailyLogs = bundle.financials.dailyLogs || [];
  const cycleAdjustments = bundle.financials.cycleAdjustments || [];
  const effectiveMonthly = bundle.financials.effectiveMonthlyFlexible
    ?? bundle.financials.monthlyFlexible;

  const previews = buildTrackerPreviews({
    budget,
    effectiveMonthlyFlexible: effectiveMonthly,
    dailyLogs,
    activeCycle,
    cycleAdjustments,
  });
  const lastClosedCycleId = getLastClosedCycle(cycleStore)?.id ?? null;

  const backfillPending = useMemo(
    () => Boolean(activeCycle && isCycleBackfillPending(activeCycle, dailyLogs)),
    [activeCycle, dailyLogs],
  );

  const paceBannerContext = activeCycle ? previews.periodPace : null;

  return (
    <>
      <SpendingPaceBanner
        backfillPending={backfillPending}
        periodPace={paceBannerContext}
      />

      <CyclePaceCard
        pace={previews.cycle}
        budget={budget}
        activeCycle={activeCycle}
        cycleAdjustments={cycleAdjustments}
        currency={currency}
        idleDefaultBudget={activeCycle ? 0 : effectiveMonthly}
      />

      <CycleControlSection
        activeCycle={activeCycle}
        cycleAdjustments={cycleAdjustments}
        currency={currency}
        dailyLogs={dailyLogs}
        onStartPress={() => setStartOpen(true)}
        onEndPress={() => setCloseOpen(true)}
        onLogDueDay={onLogDueDay}
      />

      {calendarSlot}

      {footerSlot}

      <StartCycleWizard
        visible={startOpen}
        onClose={() => setStartOpen(false)}
        budget={budget}
        defaultPaymentAmount={bundle.financials.totalIncome}
        totalIncome={bundle.financials.totalIncome}
        fixedCosts={bundle.financials.fixedCosts}
        debtPayments={bundle.financials.debtPayments}
        budgetSpendingRatio={bundle.financials.budgetSpendingRatio}
        deductSavingsGoal={bundle.financials.deductSavingsGoal === true}
        savingsGoalDeduction={bundle.financials.savingsGoalDeduction || 0}
        currency={currency}
        cycleAdjustments={cycleAdjustments}
        lastClosedCycleId={lastClosedCycleId}
      />

      <CloseCycleWizard
        visible={closeOpen}
        onClose={() => setCloseOpen(false)}
        onGoBackAndLog={onGoBackAndLog}
        cycle={activeCycle}
        budget={budget}
        income={bundle.financials.income}
        dailyLogs={dailyLogs}
        currency={currency}
        cycleAdjustments={cycleAdjustments}
      />
    </>
  );
}
