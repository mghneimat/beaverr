import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { buildLedgerCascade } from '../../lib/ledgerCascade';
import { buildIncomeBurnRate } from '../../lib/burnRate';
import { useDashboardFrequency } from '../../lib/useDashboardFrequency';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import { navigateFromDashboard } from '../../lib/screenTransition';
import {
  computeSavedSoFar,
  computeToSpendRemaining,
} from '../../lib/jarRouting';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import DashboardFrequencyHeaderControls from './DashboardFrequencyHeaderControls';
import AIInsightSection from './AIInsightSection';
import { getTabInsight } from '../../lib/insights';
import { SavedSoFarLabel } from './JarsPanel';
import MetricExplainModal from './MetricExplainModal';
import { formatDashboardAmount, resolveDashboardAmount } from './formatDashboardAmount';
import { compactChildren } from '../../lib/compactChildren';
import {
  BurnRateAnimatedAmount,
  BurnRateBar,
  BurnRateHorizontalLegend,
  BurnRateIncomePill,
  BurnRateSpendHero,
} from './BurnRateVisuals';
import TabSectionStack from './TabSectionStack';

function buildBurnAnimationKey(burn) {
  return `${burn.income}|${burn.segments.map((seg) => `${seg.key}:${seg.value}`).join(',')}`;
}

export default function DashboardPlanOverview({
  financials,
  currency,
  insights,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { isPhone } = useDashboardLayout();
  const tabInsight = getTabInsight('home', insights, t);
  const [savedExplainOpen, setSavedExplainOpen] = useState(false);
  const cascade = buildLedgerCascade(financials, insights || {});
  const burn = buildIncomeBurnRate(cascade);
  const budget = financials.budget || {};
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const spendingMonthly = Number(financials.effectiveMonthlyFlexible ?? financials.monthlyFlexible) || 0;
  const dailyLogs = financials.dailyLogs || [];

  const { frequency, setFrequency } = useDashboardFrequency(
    financials.budgetDisplayFrequency || 'daily',
  );

  const savedSoFar = computeSavedSoFar({
    budget,
    income: financials.income,
    goalGap: insights?.goalGap,
    frequency,
    dailyLogs,
    effectiveMonthlyFlexible: spendingMonthly,
  });

  const spendRemaining = computeToSpendRemaining({
    budget,
    effectiveMonthlyFlexible: spendingMonthly,
    dailyLogs,
    frequency,
  });

  const go = (route) => navigateFromDashboard(router, route);
  const toSpendDisplay = formatDashboardAmount(spendRemaining.monthRemaining, frequency, currency, daysInMonth);
  const savedDisplay = formatDashboardAmount(savedSoFar.totalMonthly, frequency, currency, daysInMonth);
  const incomeDisplay = formatDashboardAmount(burn.income, frequency, currency, daysInMonth);
  const toSpendAmountValue = resolveDashboardAmount(spendRemaining.monthRemaining, frequency, daysInMonth);
  const savedAmountValue = resolveDashboardAmount(savedSoFar.totalMonthly, frequency, daysInMonth);
  const incomeAmountValue = resolveDashboardAmount(burn.income, frequency, daysInMonth);
  const periodLabel = t(`common.${frequency}`);
  const formatPeriodAmount = (monthlyValue) => formatDashboardAmount(
    monthlyValue,
    frequency,
    currency,
    daysInMonth,
  );

  const burnAnimationKey = buildBurnAnimationKey(burn);
  const amountAnimationKey = `${frequency}|${burnAnimationKey}`;

  const routeByKey = {
    committed: 'costs',
    saved: 'goals',
    toSpend: 'budget',
    unallocated: 'budget',
  };
  const hintByKey = {
    committed: t('dashboard.ledgerCascade.openExpenses'),
    saved: t('dashboard.ledgerCascade.openGoals'),
    toSpend: t('dashboard.ledgerCascade.openBudget'),
    unallocated: t('dashboard.ledgerCascade.openBudget'),
  };
  const legendItems = burn.segments.map((seg) => ({
    key: seg.key,
    color: seg.color,
    label: t(seg.labelKey),
    amount: formatPeriodAmount(seg.value),
    amountValue: resolveDashboardAmount(seg.value, frequency, daysInMonth),
    currency,
    sharePct: burn.income > 0 ? (seg.value / burn.income) * 100 : null,
    onPress: () => go(routeByKey[seg.key] || 'budget'),
    hint: hintByKey[seg.key],
  }));

  const savedExplainRows = [
    {
      label: t('dashboard.home.savedSoFar.explain.piggyBank'),
      value: formatCurrency(savedSoFar.underspendSaved, currency),
    },
    {
      label: t('dashboard.home.savedSoFar.explain.plannedSavings'),
      value: formatCurrency(savedSoFar.plannedSavingsElapsed, currency),
    },
    {
      label: t('dashboard.home.savedSoFar.explain.total'),
      value: formatCurrency(savedSoFar.totalMonthly, currency),
      emphasis: true,
    },
  ];

  return (
    <TabSectionStack>
      {compactChildren(
        <>
          <SurfaceCard>
            <View style={{ width: '100%' }}>
              {compactChildren(
                <>
                  <DashboardFrequencyHeaderControls
                    layout="stacked"
                    title={t('dashboard.home.burnRate.title')}
                    scope="home"
                    value={frequency}
                    onChange={setFrequency}
                  />
                  <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
                    {t('dashboard.home.burnRate.incomeBase')}
                  </Text>
                  <View style={{ width: '100%', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 }}>
                      <BurnRateIncomePill
                        label={burn.isOvercommitted
                          ? t('dashboard.home.burnRate.overcommitted')
                          : t('dashboard.home.burnRate.incomeLabel')}
                        amount={incomeDisplay}
                        amountValue={incomeAmountValue}
                        currency={currency}
                        animationKey={amountAnimationKey}
                        isOvercommitted={burn.isOvercommitted}
                      />
                    </View>
                    <BurnRateBar
                      segments={burn.segments}
                      income={burn.income}
                      isOvercommitted={burn.isOvercommitted}
                      animationKey={burnAnimationKey}
                      barScale={burn.barScale ?? 1}
                    />
                  </View>
                  <BurnRateHorizontalLegend
                    items={legendItems}
                    animationKey={burnAnimationKey}
                    amountAnimationKey={amountAnimationKey}
                  />
                  <View style={{
                    marginTop: 20,
                    paddingTop: 20,
                    borderTopWidth: 1,
                    borderTopColor: C.border,
                    width: '100%',
                  }}>
                    {compactChildren(
                      <>
                        <View style={{
                          flexDirection: isPhone ? 'column' : 'row',
                          alignItems: 'flex-start',
                          width: '100%',
                          gap: isPhone ? 16 : 0,
                        }}>
                          <View style={{ flex: 1, paddingRight: isPhone ? 0 : 12, width: isPhone ? '100%' : undefined, minWidth: 0 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: C.muted, marginBottom: 8 }}>
                              {t('dashboard.home.toSpendToday.title')}
                            </Text>
                            <BurnRateSpendHero
                              amount={toSpendDisplay}
                              amountValue={toSpendAmountValue}
                              currency={currency}
                              burnAnimationKey={burnAnimationKey}
                              amountAnimationKey={amountAnimationKey}
                            />
                            <Text style={{ ...T.caption, color: C.muted, marginTop: 6 }}>
                              {t('dashboard.home.toSpendToday.perPeriod', { period: periodLabel })}
                            </Text>
                            {frequency === 'daily' ? (
                              <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
                                {t('dashboard.home.savedSoFar.dailyNote')}
                              </Text>
                            ) : null}
                          </View>
                          {!isPhone ? (
                          <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: C.border, marginVertical: 4 }} />
                          ) : (
                          <View style={{ width: '100%', height: 1, backgroundColor: C.border }} />
                          )}
                          <View style={{ flex: 1, paddingLeft: isPhone ? 0 : 12, width: isPhone ? '100%' : undefined, minWidth: 0 }}>
                            <SavedSoFarLabel onInfoPress={() => setSavedExplainOpen(true)} />
                            <BurnRateAnimatedAmount
                              text={savedDisplay}
                              amountValue={savedAmountValue}
                              currency={currency}
                              animationKey={amountAnimationKey}
                              style={{ fontSize: 32, fontWeight: '700', color: C.primary, ...tabularNums }}
                            />
                            <Text style={{ ...T.caption, color: C.muted, marginTop: 6 }}>
                              {t('dashboard.home.savedSoFar.perPeriod', { period: periodLabel })}
                            </Text>
                          </View>
                        </View>
                      </>,
                    )}
                  </View>
                </>,
              )}
            </View>
          </SurfaceCard>

          {tabInsight ? (
            <AIInsightSection
              paragraphs={tabInsight.paragraphs}
              ctaLabel={tabInsight.ctaLabel}
              onCtaPress={
                tabInsight.route
                  ? () => navigateFromDashboard(router, tabInsight.route)
                  : undefined
              }
              accessibilityLabel={tabInsight.ctaLabel}
            />
          ) : null}
        </>,
      )}

      <MetricExplainModal
        visible={savedExplainOpen}
        onClose={() => setSavedExplainOpen(false)}
        title={t('dashboard.home.savedSoFar.title')}
        value={savedDisplay}
        meaning={{
          title: t('dashboard.home.savedSoFar.explain.meaningTitle'),
          body: t('dashboard.home.savedSoFar.explain.meaningBody'),
        }}
        calculationTitle={t('dashboard.home.savedSoFar.explain.calculationTitle')}
        rows={savedExplainRows}
        formula={t('dashboard.home.savedSoFar.explain.formula', {
          days: savedSoFar.completedDays,
          totalDays: savedSoFar.daysInMonth,
        })}
        gotItLabel={t('dashboard.metricExplain.gotIt')}
        accessibilityLabel={t('dashboard.metricExplain.closeA11y')}
      />
    </TabSectionStack>
  );
}
