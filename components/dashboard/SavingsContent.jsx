import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { navigateToSavingsStashDetail } from '../../lib/screenTransition';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { getData, setData } from '../../lib/storage';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { addCustomStash, updateCustomStash } from '../../lib/customStashes';
import { removeCustomStashWithDestination, transferBetweenStashes } from '../../lib/stashTransfers';
import { emitDashboardToast } from '../../lib/dashboardToast';
import { computeGoalGap, getTabInsight } from '../../lib/insights';
import { loadGoals, saveGoals, pauseGoalsUsingStash } from '../../lib/goals';
import {
  buildSavingsProjection,
  getSavingsInflowBreakdown,
  getTotalSavingsBalance,
} from '../../lib/savingsProjection';
import { hasTargetSavingsGoal } from '../../lib/incomeGoals';
import { buildSavingsStashLines, getSavingsStashAnimationKey } from '../../lib/jarRouting';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import TabSectionStack from './TabSectionStack';
import AIInsightSection from './AIInsightSection';
import SavingsProjectionChart from './SavingsProjectionChart';
import JarsBudgetGrid from './JarsBudgetGrid';
import { useJarFocusHighlight } from './useJarFocusHighlight';
import JarFocusGlowOutline from './JarFocusGlowOutline';

const INFLOW_KEYS = {
  budgetShift: 'dashboard.savingsScreen.inflow.budgetShift',
  goalReserve: 'dashboard.savingsScreen.inflow.goalReserve',
  ongoingGoal: 'dashboard.savingsScreen.inflow.ongoingGoal',
  resetPolicy: 'dashboard.savingsScreen.inflow.resetPolicy',
  resetLoose: 'dashboard.savingsScreen.inflow.resetLoose',
};

export default function SavingsContent({ bundle, currency }) {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams();
  const focusJarId = Array.isArray(params.focusJar) ? params.focusJar[0] : params.focusJar;
  const totalBalanceRef = useRef(null);
  const { glowToken, onGlowComplete } = useJarFocusHighlight(
    focusJarId,
    'savings',
    totalBalanceRef,
  );
  const goalGap = computeGoalGap(bundle.financials);
  const projection = buildSavingsProjection({
    financials: bundle.financials,
    goalGap,
  });
  const balance = getTotalSavingsBalance(bundle.financials, goalGap);
  const tabInsight = getTabInsight('savings', bundle.insights, t, {
    financials: bundle.financials,
    savingsBalance: balance,
    formatAmount: (monthly) => formatCurrency(monthly, currency),
  });
  const inflows = getSavingsInflowBreakdown(bundle.financials, goalGap);
  const inc = bundle.financials.income || {};
  const budget = bundle.financials.budget || {};
  const { primary: primaryJarLines, custom: customJarLines } = buildSavingsStashLines({
    budget,
    income: inc,
  });
  const stashTabCount = primaryJarLines.length + customJarLines.length;
  const jarsAnimationKey = getSavingsStashAnimationKey(budget);

  const handleAddStash = useCallback(async (name, description = '') => {
    const saved = (await getData('beaverr_budget')) || {};
    const { budget: nextBudget, error } = addCustomStash(saved, name, description);
    if (error) return error;
    await setData('beaverr_budget', nextBudget);
    notifyDashboardRefresh();
    emitDashboardToast('stashCreated');
    return null;
  }, []);

  const handleUpdateStash = useCallback(async (stashId, { name, description }) => {
    const saved = (await getData('beaverr_budget')) || {};
    const { budget: nextBudget, error } = updateCustomStash(saved, stashId, { name, description });
    if (error) return error;
    await setData('beaverr_budget', nextBudget);
    notifyDashboardRefresh();
    emitDashboardToast('stashRenamed');
    return null;
  }, []);

  const handleDeleteStash = useCallback(async (stashId, destination = 'looseCash') => {
    const savedBudget = (await getData('beaverr_budget')) || {};
    const savedIncome = (await getData('beaverr_income')) || {};
    const { budget: nextBudget, income: nextIncome, error } = removeCustomStashWithDestination(
      savedBudget,
      stashId,
      { income: savedIncome, destination },
    );
    if (error) return;
    const goals = await loadGoals();
    const paused = pauseGoalsUsingStash(goals, stashId);
    await saveGoals(paused);
    await setData('beaverr_budget', nextBudget);
    if (nextIncome) await setData('beaverr_income', nextIncome);
    notifyDashboardRefresh();
    emitDashboardToast('stashDeleted');
  }, []);

  const handleStashPress = useCallback((line) => {
    navigateToSavingsStashDetail(router, line.id);
  }, [router]);

  const handleTransferStash = useCallback(async (fromRef, toRef, amount) => {
    const savedBudget = (await getData('beaverr_budget')) || {};
    const savedIncome = (await getData('beaverr_income')) || {};
    const { budget: nextBudget, income: nextIncome, error } = transferBetweenStashes(
      savedBudget,
      savedIncome,
      fromRef,
      toRef,
      amount,
    );
    if (error) return error;
    await setData('beaverr_budget', nextBudget);
    await setData('beaverr_income', nextIncome);
    notifyDashboardRefresh();
    emitDashboardToast('stashTransferred');
    return null;
  }, []);

  return (
    <TabSectionStack>
      <View ref={totalBalanceRef} collapsable={false}>
        <JarFocusGlowOutline glowToken={glowToken} onComplete={onGlowComplete} variant="surface">
          <SurfaceCard>
            <InCardSectionHeader title={t('dashboard.savingsScreen.totalBalance')} />
            <Text style={{ fontSize: 32, fontWeight: '700', color: C.primary, ...tabularNums }}>
              {formatCurrency(balance, currency)}
            </Text>
            <Text style={{ ...T.helper, color: C.muted, marginTop: 8 }}>
              {t('dashboard.savingsScreen.balanceHelper', { count: stashTabCount })}
            </Text>
          </SurfaceCard>
        </JarFocusGlowOutline>
      </View>

      {tabInsight ? <AIInsightSection paragraphs={tabInsight.paragraphs} /> : null}

      <JarsBudgetGrid
        layout="savings"
        primaryJarLines={primaryJarLines}
        customJarLines={customJarLines}
        budget={budget}
        income={inc}
        currency={currency}
        animationKey={jarsAnimationKey}
        onTransferStash={handleTransferStash}
        onStashPress={handleStashPress}
        onAddStash={handleAddStash}
        onUpdateStash={handleUpdateStash}
        onDeleteStash={handleDeleteStash}
        focusJarId={focusJarId}
      />

      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.savingsScreen.monthlyPlan')} />
        <Text style={{ fontSize: 22, fontWeight: '700', color: C.primary, ...tabularNums }}>
          {formatCurrency(projection.monthlyInflow, currency)}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>
          {t('dashboard.savingsScreen.monthlyPlanHelper')}
        </Text>
        {inflows.length > 0 ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            {inflows.map((row) => (
              <View
                key={row.key}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text style={{ ...T.helper, flex: 1, paddingRight: 8 }}>
                  {t(INFLOW_KEYS[row.key] || row.key)}
                </Text>
                {row.amount > 0 ? (
                  <Text style={{ ...T.helper, fontWeight: '600', ...tabularNums }}>
                    {formatCurrency(row.amount, currency)}
                  </Text>
                ) : (
                  <Text style={{ ...T.caption, color: C.muted }}>{t('dashboard.savingsScreen.variable')}</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ ...T.helper, color: C.muted, marginTop: 12 }}>
            {t('dashboard.savingsScreen.noInflows')}
          </Text>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.savingsScreen.projectionTitle')} />
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 16 }}>
          {hasTargetSavingsGoal(inc) && inc.goalDate
            ? t('dashboard.savingsScreen.projectionGoalHelper', {
              target: formatCurrency(inc.goalAmount, currency),
              date: inc.goalDate,
            })
            : t('dashboard.savingsScreen.projectionHelper')}
        </Text>
        <SavingsProjectionChart projection={projection} currency={currency} />
      </SurfaceCard>
    </TabSectionStack>
  );
}
