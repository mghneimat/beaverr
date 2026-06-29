import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { navigateToSavingsStashDetail } from '../../lib/screenTransition';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { getData, setData } from '../../lib/storage';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { addCustomStash, updateCustomStash, getCustomStashById } from '../../lib/customStashes';
import { removeCustomStashWithDestination, transferBetweenStashes } from '../../lib/stashTransfers';
import { deleteCommitmentSource, renewCommitmentStash, loadRawSections } from '../../lib/commitmentActions';
import { syncSinkingFundStashes } from '../../lib/sinkingStashes';
import { emitDashboardToast } from '../../lib/dashboardToast';
import { computeGoalGap, getTabInsight } from '../../lib/insights';
import { loadGoals, saveGoals, pauseGoalsUsingStash } from '../../lib/goals';
import {
  buildSavingsChartData,
  getExpectedYearEndSavings,
  getSavingsInflowBreakdown,
  getTotalSavingsBalance,
} from '../../lib/savingsProjection';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import { buildSavingsStashLines, getJarTitle, getSavingsStashAnimationKey } from '../../lib/jarRouting';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import { InfoIcon } from '../app/AppNavIcons';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import TabSectionStack from './TabSectionStack';
import AIInsightSection from './AIInsightSection';
import SavingsProjectionChart from './SavingsProjectionChart';
import JarsBudgetGrid from './JarsBudgetGrid';
import SavingsMonthlyPlanCard from './SavingsMonthlyPlanCard';
import MetricExplainModal from './MetricExplainModal';
import DeleteStashSheet from './DeleteStashSheet';
import { useJarFocusHighlight } from './useJarFocusHighlight';
import JarFocusGlowOutline from './JarFocusGlowOutline';

const INFO_SIZE = 16;
const INFO_HIT = 28;

function SavingsBalanceColumn({
  title,
  amount,
  helper,
  currency,
  onInfoPress,
  infoA11y,
}) {
  const { isPhone, isNarrow } = useDashboardLayout();
  const amountFontSize = isPhone || isNarrow ? 28 : 32;
  const amountLineHeight = isPhone || isNarrow ? 34 : 38;

  return (
    <View style={{ flex: 1, minWidth: 0, width: '100%' }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 8,
      }}>
        <Text style={{ ...T.cardTitle, flex: 1, minWidth: 0 }} numberOfLines={2}>
          {title}
        </Text>
        {onInfoPress ? (
          <Pressable
            onPress={onInfoPress}
            accessibilityRole="button"
            accessibilityLabel={infoA11y}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed, hovered }) => ({
              width: INFO_HIT,
              height: INFO_HIT,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: R.input,
              flexShrink: 0,
              backgroundColor: pressed
                ? C.overlayPressed
                : hovered && Platform.OS === 'web'
                  ? C.overlayHover
                  : 'transparent',
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            })}
          >
            <InfoIcon color={C.muted} size={INFO_SIZE} />
          </Pressable>
        ) : null}
      </View>
      <Text
        style={{
          fontSize: amountFontSize,
          lineHeight: amountLineHeight,
          fontWeight: '700',
          color: C.text,
          ...tabularNums,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit={Platform.OS === 'ios'}
        minimumFontScale={0.7}
      >
        {formatCurrency(amount, currency)}
      </Text>
      <Text style={{ ...T.helper, color: C.muted, marginTop: 8 }} numberOfLines={2}>
        {helper}
      </Text>
    </View>
  );
}

export default function SavingsContent({ bundle, currency }) {
  const { t } = useI18n();
  const { isPhone, isNarrow } = useDashboardLayout();
  const stackBalanceColumns = isPhone || isNarrow;
  const [totalExplainOpen, setTotalExplainOpen] = useState(false);
  const [expectedExplainOpen, setExpectedExplainOpen] = useState(false);
  const [commitmentDeleteLine, setCommitmentDeleteLine] = useState(null);
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
  const chartData = buildSavingsChartData({
    financials: bundle.financials,
    goalGap,
  });
  const balance = getTotalSavingsBalance(bundle.financials, goalGap);
  const yearEnd = getExpectedYearEndSavings({ financials: bundle.financials, goalGap });
  const tabInsight = getTabInsight('savings', bundle.insights, t, {
    financials: bundle.financials,
    savingsBalance: balance,
    formatAmount: (monthly) => formatCurrency(monthly, currency),
  });
  const inflows = getSavingsInflowBreakdown(bundle.financials, goalGap);
  const inc = bundle.financials.income || {};
  const budget = bundle.financials.budget || {};
  const { primary: primaryJarLines, savedCustom: savedCustomJarLines, commitmentCustom: commitmentCustomJarLines, custom: customJarLines } = buildSavingsStashLines({
    budget,
    income: inc,
  });
  const jarsAnimationKey = getSavingsStashAnimationKey(budget);

  const totalExplainRows = useMemo(() => {
    const prefix = 'dashboard.savingsScreen.totalBalanceExplain';
    const lines = [...primaryJarLines, ...customJarLines];
    const rows = lines.map((line) => ({
      label: getJarTitle(line, t),
      value: formatCurrency(Number(line.balance) || 0, currency),
    }));
    rows.push({
      label: t(`${prefix}.rows.total`),
      value: formatCurrency(balance, currency),
      emphasis: true,
    });
    return rows;
  }, [balance, currency, customJarLines, primaryJarLines, t]);

  const expectedExplainRows = useMemo(() => {
    const prefix = 'dashboard.savingsScreen.expectedSavingsExplain';
    return [
      {
        label: t(`${prefix}.rows.currentTotal`),
        value: formatCurrency(yearEnd.startBalance, currency),
      },
      {
        label: t(`${prefix}.rows.monthlyPlan`),
        value: formatCurrency(yearEnd.monthlyInflow, currency),
      },
      {
        label: t(`${prefix}.rows.monthsRemaining`, { year: yearEnd.year }),
        value: String(yearEnd.monthsRemaining),
      },
      {
        label: t(`${prefix}.rows.expectedTotal`),
        value: formatCurrency(yearEnd.expectedBalance, currency),
        emphasis: true,
      },
    ];
  }, [currency, t, yearEnd]);

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

  const finalizeCommitmentDelete = useCallback(async (stashId, destination = 'looseCash') => {
    const savedBudget = (await getData('beaverr_budget')) || {};
    const savedIncome = (await getData('beaverr_income')) || {};
    const stash = getCustomStashById(savedBudget, stashId);
    if (!stash?.sinkingSourceKey) return;

    const sourceResult = await deleteCommitmentSource(stash);
    if (sourceResult.error) return;

    const { budget: nextBudget, income: nextIncome, error } = removeCustomStashWithDestination(
      savedBudget,
      stashId,
      { income: savedIncome, destination },
    );
    if (error) return;

    const sections = await loadRawSections();
    const synced = syncSinkingFundStashes(nextBudget, sections, t, (amount) => formatCurrency(amount, currency));
    await setData('beaverr_budget', synced.budget);
    if (nextIncome) await setData('beaverr_income', nextIncome);
    notifyDashboardRefresh();
    emitDashboardToast('commitmentDeleted');
  }, [currency, t]);

  const handleRenewCommitment = useCallback(async (stashId) => {
    const result = await renewCommitmentStash({
      stashId,
      t,
      formatCurrency: (amount) => formatCurrency(amount, currency),
    });
    if (!result.error) {
      emitDashboardToast('commitmentRenewed');
    }
  }, [currency, t]);

  const handleDeleteCommitment = useCallback(async (stashId, options = {}) => {
    if (options.hasBalance && options.line) {
      setCommitmentDeleteLine(options.line);
      return;
    }
    await finalizeCommitmentDelete(stashId, options.destination || 'looseCash');
  }, [finalizeCommitmentDelete]);

  const handleCommitmentDeleteWithDestination = useCallback(async (destination) => {
    if (!commitmentDeleteLine?.id?.startsWith('stash:')) return;
    const stashId = commitmentDeleteLine.id.slice('stash:'.length);
    await finalizeCommitmentDelete(stashId, destination);
    setCommitmentDeleteLine(null);
  }, [commitmentDeleteLine, finalizeCommitmentDelete]);

  return (
    <TabSectionStack>
      <View ref={totalBalanceRef} collapsable={false}>
        <JarFocusGlowOutline glowToken={glowToken} onComplete={onGlowComplete} variant="surface">
          <SurfaceCard>
            <View style={{
              flexDirection: stackBalanceColumns ? 'column' : 'row',
              alignItems: 'stretch',
              gap: stackBalanceColumns ? 16 : 0,
              width: '100%',
            }}>
              <View style={{
                flex: 1,
                paddingRight: stackBalanceColumns ? 0 : 12,
                minWidth: 0,
                width: stackBalanceColumns ? '100%' : undefined,
              }}>
                <SavingsBalanceColumn
                  title={t('dashboard.savingsScreen.totalBalance')}
                  amount={balance}
                  helper={t('dashboard.savingsScreen.balanceHelper')}
                  currency={currency}
                  onInfoPress={() => setTotalExplainOpen(true)}
                  infoA11y={t('dashboard.savingsScreen.totalBalanceExplain.infoA11y')}
                />
              </View>
              {!stackBalanceColumns ? (
                <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: C.border, marginVertical: 4 }} />
              ) : (
                <View style={{ width: '100%', height: 1, backgroundColor: C.border }} />
              )}
              <View style={{
                flex: 1,
                paddingLeft: stackBalanceColumns ? 0 : 12,
                minWidth: 0,
                width: stackBalanceColumns ? '100%' : undefined,
              }}>
                <SavingsBalanceColumn
                  title={t('dashboard.savingsScreen.expectedSavings')}
                  amount={yearEnd.expectedBalance}
                  helper={t('dashboard.savingsScreen.expectedSavingsHelper', { year: yearEnd.year })}
                  currency={currency}
                  onInfoPress={() => setExpectedExplainOpen(true)}
                  infoA11y={t('dashboard.savingsScreen.expectedSavingsExplain.infoA11y')}
                />
              </View>
            </View>
          </SurfaceCard>
        </JarFocusGlowOutline>
      </View>

      {tabInsight ? <AIInsightSection paragraphs={tabInsight.paragraphs} /> : null}

      <JarsBudgetGrid
        layout="savings"
        primaryJarLines={primaryJarLines}
        savedCustomJarLines={savedCustomJarLines}
        commitmentCustomJarLines={commitmentCustomJarLines}
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
        onRenewCommitment={handleRenewCommitment}
        onDeleteCommitment={handleDeleteCommitment}
        focusJarId={focusJarId}
      />

      <SavingsMonthlyPlanCard
        monthlyInflow={chartData.monthlyInflow}
        inflows={inflows}
        budget={budget}
        currency={currency}
      />

      <SurfaceCard>
        <InCardSectionHeader
          title={t('dashboard.savingsScreen.projectionTitle')}
          style={{ marginBottom: 20 }}
        />
        <SavingsProjectionChart chartData={chartData} currency={currency} />
      </SurfaceCard>

      <MetricExplainModal
        visible={totalExplainOpen}
        onClose={() => setTotalExplainOpen(false)}
        title={t('dashboard.savingsScreen.totalBalance')}
        value={formatCurrency(balance, currency)}
        meaning={{
          title: t('dashboard.savingsScreen.totalBalanceExplain.meaningTitle'),
          body: t('dashboard.savingsScreen.totalBalanceExplain.meaningBody'),
        }}
        calculationTitle={t('dashboard.savingsScreen.totalBalanceExplain.calculationTitle')}
        rows={totalExplainRows}
        formula={t('dashboard.savingsScreen.totalBalanceExplain.formula')}
        gotItLabel={t('dashboard.metricExplain.gotIt')}
        accessibilityLabel={t('dashboard.metricExplain.closeA11y')}
      />

      <MetricExplainModal
        visible={expectedExplainOpen}
        onClose={() => setExpectedExplainOpen(false)}
        title={t('dashboard.savingsScreen.expectedSavings')}
        value={formatCurrency(yearEnd.expectedBalance, currency)}
        meaning={{
          title: t('dashboard.savingsScreen.expectedSavingsExplain.meaningTitle'),
          body: t('dashboard.savingsScreen.expectedSavingsExplain.meaningBody', { year: yearEnd.year }),
        }}
        calculationTitle={t('dashboard.savingsScreen.expectedSavingsExplain.calculationTitle')}
        rows={expectedExplainRows}
        formula={t('dashboard.savingsScreen.expectedSavingsExplain.formula', {
          months: yearEnd.monthsRemaining,
        })}
        warning={
          yearEnd.monthlyInflow <= 0
            ? t('dashboard.savingsScreen.expectedSavingsExplain.noPlanWarning')
            : yearEnd.cappedAtGoal
              ? t('dashboard.savingsScreen.expectedSavingsExplain.cappedAtGoalWarning')
              : undefined
        }
        gotItLabel={t('dashboard.metricExplain.gotIt')}
        accessibilityLabel={t('dashboard.metricExplain.closeA11y')}
      />

      <DeleteStashSheet
        visible={commitmentDeleteLine != null}
        onClose={() => setCommitmentDeleteLine(null)}
        line={commitmentDeleteLine}
        budget={budget}
        income={inc}
        currency={currency}
        onConfirmDelete={handleCommitmentDeleteWithDestination}
      />
    </TabSectionStack>
  );
}
