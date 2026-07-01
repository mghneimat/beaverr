import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import { effectiveSpendingBudget, formatCurrency } from '../../lib/finance';
import { getData, setData } from '../../lib/storage';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { buildLedgerCascade } from '../../lib/ledgerCascade';
import { splitFlexibleBudget } from '../../lib/budgetSplit';
import { C, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import YesNoToggle from '../onboarding/YesNoToggle';
import BudgetSplitSlider from '../onboarding/BudgetSplitSlider';
import { getMonthlySavingsReservation } from '../../lib/incomeGoals';
import TabHeroMetric from './TabHeroMetric';
import TabInsightCard from './TabInsightCard';
import InCardSectionHeader from './InCardSectionHeader';
import BudgetSummaryMetrics from './BudgetSummaryMetrics';
import DashboardFrequencyHeaderControls from './DashboardFrequencyHeaderControls';
import { formatDashboardAmount } from './formatDashboardAmount';
import { resolveDailySpendingDestination } from '../../lib/dailySpendingStrategy';
import RolloverStrategyOverview from './RolloverStrategyOverview';
import DailySpendingStrategyOverview from './DailySpendingStrategyOverview';
import TabSectionStack from './TabSectionStack';
import JarFocusGlowOutline from './JarFocusGlowOutline';
import { useSectionFocusHighlight } from './useSectionFocusHighlight';

export default function BudgetContent({ bundle, frequency = 'monthly', setFrequency }) {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const focusSection = Array.isArray(params.focusSection)
    ? params.focusSection[0]
    : params.focusSection;
  const rolloverAnchorRef = useRef(null);
  const { glowToken, onGlowComplete } = useSectionFocusHighlight(
    focusSection,
    'rollover',
    rolloverAnchorRef,
  );

  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const budget = bundle.financials.budget || {};
  const goalGap = bundle.insights?.goalGap;
  const hasSavingsGoal = getMonthlySavingsReservation(bundle.financials.income, goalGap) > 0;
  const deductSavingsGoal = bundle.financials.deductSavingsGoal === true;
  const savingsGoalDeduction = deductSavingsGoal
    ? getMonthlySavingsReservation(bundle.financials.income, goalGap)
    : 0;

  const [previewSplit, setPreviewSplit] = useState(null);
  const [pendingRolloverStrategy, setPendingRolloverStrategy] = useState(null);
  const [pendingDailySpending, setPendingDailySpending] = useState(null);

  useEffect(() => {
    setPreviewSplit(null);
  }, [
    bundle.financials.monthlyFlexible,
    bundle.financials.budgetSavingsShift,
    bundle.financials.budget?.budgetSpendingRatio,
  ]);

  useEffect(() => {
    setPendingRolloverStrategy(null);
  }, [budget.rolloverStrategy, budget.resetUnspentDestination]);

  useEffect(() => {
    setPendingDailySpending(null);
  }, [budget.dailyJarDestination]);

  const jarsBudget = useMemo(() => {
    let next = budget;
    if (pendingRolloverStrategy) {
      next = { ...next, rolloverStrategy: pendingRolloverStrategy };
      if (pendingRolloverStrategy === 'reset') {
        next.resetUnspentDestination = budget.resetUnspentDestination || 'looseMoney';
      }
    }
    if (pendingDailySpending) {
      next = { ...next, dailyJarDestination: pendingDailySpending };
    }
    return next;
  }, [budget, pendingRolloverStrategy, pendingDailySpending]);

  const financials = useMemo(() => {
    if (!previewSplit) return bundle.financials;

    const monthlyFlexible = previewSplit.spendingMonthly;
    const effectiveMonthlyFlexible = effectiveSpendingBudget(
      monthlyFlexible,
      savingsGoalDeduction,
      deductSavingsGoal,
    );

    return {
      ...bundle.financials,
      monthlyFlexible,
      budgetSavingsShift: previewSplit.savingsShift,
      effectiveMonthlyFlexible,
      budget: {
        ...(bundle.financials.budget || {}),
        budgetSpendingRatio: previewSplit.ratio,
        monthlyFlexible,
        budgetSavingsShift: previewSplit.savingsShift,
      },
    };
  }, [bundle.financials, previewSplit, savingsGoalDeduction, deductSavingsGoal]);

  const spendingMonthly = financials.effectiveMonthlyFlexible ?? financials.monthlyFlexible;
  const heroValue = formatDashboardAmount(spendingMonthly, frequency, currency, daysInMonth);
  const monthlyDisplay = formatCurrency(spendingMonthly, currency);
  const annualDisplay = formatCurrency(spendingMonthly * 12, currency);

  const cascade = useMemo(
    () => buildLedgerCascade(financials, bundle.insights || {}),
    [financials, bundle.insights],
  );

  const spendingRatio = financials.budget?.budgetSpendingRatio != null
    ? financials.budget.budgetSpendingRatio
    : (financials.availableBudget > 0
      ? financials.monthlyFlexible / financials.availableBudget
      : 1);

  const remainingPct = cascade.income > 0 ? cascade.available / cascade.income : 0;

  const handleSpendingRatioChange = useCallback(async (ratio) => {
    const avail = Number(financials.availableBudget) || 0;
    const split = splitFlexibleBudget(avail, ratio);
    setPreviewSplit(split);

    const saved = (await getData('beaverr_budget')) || {};
    await setData('beaverr_budget', {
      ...saved,
      budgetSpendingRatio: split.ratio,
      monthlyFlexible: split.spendingMonthly,
      budgetSavingsShift: split.savingsShift,
    });
    notifyDashboardRefresh();
  }, [financials.availableBudget]);

  const handleSpendingPreviewChange = useCallback((ratio) => {
    if (ratio == null) {
      setPreviewSplit(null);
      return;
    }
    const avail = Number(financials.availableBudget) || 0;
    if (avail <= 0) return;
    const split = splitFlexibleBudget(avail, ratio);
    setPreviewSplit(split);
  }, [financials.availableBudget]);

  const handleDeductChange = useCallback(async (value) => {
    const saved = (await getData('beaverr_budget')) || {};
    await setData('beaverr_budget', { ...saved, deductSavingsGoal: value === true });
    notifyDashboardRefresh();
  }, []);

  const handleRolloverStrategyChange = useCallback(async (strategy) => {
    const current = budget.rolloverStrategy || 'free';
    if (strategy === current) return;

    setPendingRolloverStrategy(strategy);

    const saved = (await getData('beaverr_budget')) || {};
    const next = { ...saved, rolloverStrategy: strategy };

    if (strategy === 'reset') {
      next.resetUnspentDestination = saved.resetUnspentDestination || 'looseMoney';
    }

    await setData('beaverr_budget', next);
    notifyDashboardRefresh();
  }, [budget.rolloverStrategy]);

  const handleDailySpendingChange = useCallback(async (destination) => {
    const current = resolveDailySpendingDestination(budget);
    if (destination === current) return;

    setPendingDailySpending(destination);

    const saved = (await getData('beaverr_budget')) || {};
    await setData('beaverr_budget', {
      ...saved,
      dailyJarEnabled: true,
      dailyJarDestination: destination,
    });
    notifyDashboardRefresh();
  }, [budget.dailyJarDestination]);

  const frequencyControls = setFrequency ? (
    <DashboardFrequencyHeaderControls
      layout="inline"
      scope="budget"
      value={frequency}
      onChange={setFrequency}
    />
  ) : null;

  return (
    <TabSectionStack>
      <TabHeroMetric
        label={t('dashboard.budgetScreen.flexible')}
        value={heroValue}
        animationKey={frequency}
        trailing={frequencyControls}
        frequencyCaption={setFrequency ? t('dashboard.frequencyHelper.budget.summary') : null}
        secondaryLabel={t('dashboard.budgetScreen.annualEquivalent', {
          amount: annualDisplay,
          monthly: monthlyDisplay,
        })}
      />

      <TabInsightCard tabKey="budget" financials={financials} />

      <BudgetSummaryMetrics
        income={cascade.income}
        committed={cascade.committed}
        remaining={cascade.available}
        remainingPct={remainingPct}
        isOvercommitted={cascade.isOvercommitted}
        currency={currency}
        frequency={frequency}
        daysInMonth={daysInMonth}
      />

      {cascade.showUnallocatedSlider ? (
        <SurfaceCard>
          <InCardSectionHeader title={t('dashboard.budgetScreen.unallocatedSlider.title')} />
          <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
            {t('dashboard.budgetScreen.unallocatedSlider.helper', {
              amount: formatCurrency(financials.availableBudget, currency),
            })}
          </Text>
          <BudgetSplitSlider
            value={spendingRatio}
            onChange={handleSpendingRatioChange}
            onPreviewChange={handleSpendingPreviewChange}
            totalAvailable={financials.availableBudget}
            currency={currency}
          />
        </SurfaceCard>
      ) : null}

      {hasSavingsGoal ? (
        <SurfaceCard>
          <InCardSectionHeader title={t('dashboard.budgetScreen.deductSavingsGoal.label')} />
          <Text style={{ ...T.helper, color: C.muted, marginBottom: 12 }}>
            {t('dashboard.budgetScreen.deductSavingsGoal.helper')}
          </Text>
          <YesNoToggle
            value={deductSavingsGoal}
            onChange={handleDeductChange}
            yesLabel={t('dashboard.budgetScreen.deductSavingsGoal.yes')}
            noLabel={t('dashboard.budgetScreen.deductSavingsGoal.no')}
            containerStyle={{ marginBottom: 0 }}
          />
        </SurfaceCard>
      ) : null}

      <View ref={rolloverAnchorRef} collapsable={false}>
        <JarFocusGlowOutline
          glowToken={glowToken}
          onComplete={onGlowComplete}
          variant="surface"
        >
          <SurfaceCard>
            <RolloverStrategyOverview
              budget={jarsBudget}
              onStrategyChange={handleRolloverStrategyChange}
            />
          </SurfaceCard>
        </JarFocusGlowOutline>
      </View>

      <SurfaceCard>
        <DailySpendingStrategyOverview
          budget={jarsBudget}
          onStrategyChange={handleDailySpendingChange}
        />
      </SurfaceCard>

    </TabSectionStack>
  );
}
