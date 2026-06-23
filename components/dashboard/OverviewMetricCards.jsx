import { useState, useMemo, useCallback } from 'react';

import { View, Platform, useWindowDimensions } from 'react-native';

import { useRouter } from 'expo-router';
import { navigateFromDashboard } from '../../lib/screenTransition';

import { useI18n } from '../../lib/i18n';

import { formatCurrency, displayBudget, toMonthly, committedMonthlyLoad } from '../../lib/finance';
import { formatDateDisplay } from '../../lib/datePicker';

import { useDashboardFrequency } from '../../lib/useDashboardFrequency';
import { useDashboardLayout } from '../../lib/dashboardLayout';

import { C, S } from '../../constants/onboarding-theme';

import MetricExplainCard from './MetricExplainCard';

import MetricExplainModal from './MetricExplainModal';

import DashboardFrequencyDropdown from './DashboardFrequencyDropdown';

import { formatDashboardAmount, resolveDashboardAmount } from './formatDashboardAmount';
import DashboardSnapshotGrid from './DashboardSnapshotGrid';
import { BudgetIcon, CostsIcon, GoalsIcon } from '../app/AppNavIcons';
import {
  GOAL_TYPES,
  hasOngoingSavingsGoal,
  hasTargetSavingsGoal,
  normalizeIncomeGoalFields,
} from '../../lib/incomeGoals';



const PREFIX = 'dashboard.metricExplain';



const TAB_ROUTES = {

  flexibleBudget: 'budget',

  savingsGoal: 'goals',

  fixedLoad: 'costs',

  monthlyBuffer: 'budget',

  recurring: 'costs',

  committedTotal: 'costs',

  cashAfterBills: 'costs',

};



const DEFAULT_SECONDARY_METRICS = [];

function cardCopy(t, prefix, id, field, fallbackKey) {
  if (!prefix) return t(fallbackKey);
  const key = `${prefix}.${id}.${field}`;
  const translated = t(key);
  return translated !== key ? translated : t(fallbackKey);
}

export default function OverviewMetricCards({
  financials,
  insights,
  currency,
  daysInMonth,
  showHeroPanels = true,
  secondaryMetricIds = DEFAULT_SECONDARY_METRICS,
  cardLabelPrefix,
  cardVariant,
  embedded = false,
}) {

  const { t, locale } = useI18n();

  const router = useRouter();

  const { width } = useWindowDimensions();
  const { isPhone } = useDashboardLayout();

  const stackHero = isPhone || width < 520;

  const { frequency, setFrequency } = useDashboardFrequency(financials.budgetDisplayFrequency || 'daily');

  const [activeMetric, setActiveMetric] = useState(null);



  const fixedLoad = committedMonthlyLoad(financials);

  const availableAfterBills = Number(financials.availableBudget) || 0;

  const fixedLoadPct = Math.round(insights.fixedCostRatio * 100);

  const recurringPct = Math.round(insights.recurringCommitmentRatio * 100);

  const surplus = insights.surplusMonthly;

  const goalGap = insights.goalGap;

  const inc = financials.income;



  const fixedLoadStatus = insights.flags.overcommitted

    ? 'overcommitted'

    : insights.flags.tight

      ? 'tight'

      : null;



  const goToTab = useCallback((metricId) => {

    const route = TAB_ROUTES[metricId];

    if (route) navigateFromDashboard(router, route);

  }, [router]);



  const spendingMonthly = financials.effectiveMonthlyFlexible ?? financials.monthlyFlexible;
  const spendingValue = formatDashboardAmount(spendingMonthly, frequency, currency, daysInMonth);
  const spendingAmountValue = resolveDashboardAmount(spendingMonthly, frequency, daysInMonth);



  const totalSaved = Number(inc?.savingsBalance) || 0;

  const goalPanel = useMemo(() => {

    const { goalType } = normalizeIncomeGoalFields(inc);
    const savedValue = formatCurrency(totalSaved, currency);
    const period = t(`common.${frequency}`);

    if (goalType === GOAL_TYPES.REDUCE_COSTS) {
      return {
        value: savedValue,
        amountValue: totalSaved,
        footerLabel: t('dashboard.home.goalTracking.reduceCostsLabel'),
        showFrequency: false,
      };
    }

    if (!hasTargetSavingsGoal(inc) && !hasOngoingSavingsGoal(inc)) {
      return {
        value: savedValue,
        amountValue: totalSaved,
        footerLabel: t('dashboard.home.hero.setGoalPrompt'),
        showFrequency: false,
      };
    }

    const monthlyPace = hasOngoingSavingsGoal(inc)
      ? Number(inc.savingsMonthlyTarget) || 0
      : goalGap?.monthlyRequired ?? 0;

    const paceAmount = formatDashboardAmount(monthlyPace, frequency, currency, daysInMonth);

    if (hasOngoingSavingsGoal(inc)) {
      return {
        value: savedValue,
        amountValue: totalSaved,
        footerLabel: t('dashboard.home.goalTracking.ongoingPaceLabel', { amount: paceAmount, period }),
        showFrequency: true,
      };
    }

    return {
      value: savedValue,
      amountValue: totalSaved,
      footerLabel: t('dashboard.home.goalTracking.savePaceLabel', { amount: paceAmount, period }),
      showFrequency: true,
    };

  }, [inc, goalGap, totalSaved, currency, frequency, daysInMonth, locale, t]);



  const metrics = useMemo(() => ({

    committedTotal: {

      label: cardCopy(t, cardLabelPrefix, 'committedTotal', 'label', 'dashboard.expensesScreen.committedCosts'),

      value: formatCurrency(fixedLoad, currency),

      amountValue: fixedLoad,

      footerLabel: cardCopy(t, cardLabelPrefix, 'committedTotal', 'footer', 'dashboard.home.kpi.committedCostsHint'),

    },

    cashAfterBills: {

      label: cardCopy(t, cardLabelPrefix, 'cashAfterBills', 'label', 'dashboard.ledgerCascade.available'),

      value: availableAfterBills < 0
        ? `−${formatCurrency(Math.abs(availableAfterBills), currency)}`
        : formatCurrency(availableAfterBills, currency),

      amountValue: availableAfterBills,

      footerLabel: availableAfterBills < 0
        ? cardCopy(t, cardLabelPrefix, 'cashAfterBills', 'overByFooter', 'dashboard.home.health.status.overcommitted')
        : cardCopy(t, cardLabelPrefix, 'cashAfterBills', 'footer', 'dashboard.metricExplain.rows.available'),

      statusLabel: availableAfterBills < 0
        ? t('dashboard.home.health.status.overcommitted')
        : null,

      statusColor: availableAfterBills < 0 ? C.danger : undefined,

    },

    fixedLoad: {

      label: cardCopy(t, cardLabelPrefix, 'fixedLoad', 'label', 'dashboard.home.health.fixedLoad'),

      value: `${fixedLoadPct}%`,

      footerLabel: cardCopy(t, cardLabelPrefix, 'fixedLoad', 'footer', 'dashboard.home.health.fixedLoadLabel'),

      statusLabel: fixedLoadStatus ? t(`dashboard.home.health.status.${fixedLoadStatus}`) : null,

      statusColor: fixedLoadStatus === 'overcommitted' ? C.danger : fixedLoadStatus === 'tight' ? C.infoText : undefined,

    },

    monthlyBuffer: {

      label: t('dashboard.home.health.budgetFlexibility'),

      value: surplus < 0 ? `−${formatCurrency(Math.abs(surplus), currency)}` : formatCurrency(surplus, currency),

      amountValue: surplus,

      footerLabel: t('dashboard.home.health.budgetFlexibilityLabel'),

      statusLabel: insights.flags.negativeSurplus ? t('dashboard.home.health.status.deficit') : null,

      statusColor: insights.flags.negativeSurplus ? C.danger : undefined,

    },

    recurring: {

      label: cardCopy(t, cardLabelPrefix, 'recurring', 'label', 'dashboard.home.health.recurring'),

      value: `${recurringPct}%`,

      footerLabel: cardCopy(t, cardLabelPrefix, 'recurring', 'footer', 'dashboard.home.health.recurringLabel'),

    },

  }), [

    financials,

    insights,

    currency,

    fixedLoad,

    availableAfterBills,

    fixedLoadPct,

    surplus,

    fixedLoadStatus,

    recurringPct,

    cardLabelPrefix,

    locale,

    t,

  ]);



  const buildModal = useCallback((id) => {

    const rows = `${PREFIX}.rows`;

    const shared = {

      meaningTitle: t(`${PREFIX}.whatItMeans`),

      calculationTitle: t(`${PREFIX}.calculation`),

    };

    const displayAmount = displayBudget(spendingMonthly, frequency, daysInMonth);

    const flexibleRows = [

      { label: t(`${rows}.income`), value: formatCurrency(financials.totalIncome, currency) },

      { label: t(`${rows}.fixedCosts`), value: `−${formatCurrency(financials.fixedCosts, currency)}` },

      { label: t(`${rows}.debtPayments`), value: `−${formatCurrency(financials.debtPayments, currency)}` },

      { label: t(`${rows}.available`), value: formatCurrency(financials.availableBudget, currency) },

      { label: t(`${rows}.flexibleBudget`), value: formatCurrency(financials.monthlyFlexible, currency) },

    ];

    if (financials.deductSavingsGoal && financials.savingsGoalDeduction > 0) {

      flexibleRows.push({

        label: t(`${rows}.savingsReservation`),

        value: `−${formatCurrency(financials.savingsGoalDeduction, currency)}`,

      });

    }

    flexibleRows.push(

      { label: t(`${rows}.spendingBudget`), value: formatCurrency(spendingMonthly, currency), emphasis: true },

      { label: t(`${rows}.daysInMonth`), value: String(daysInMonth) },

      { label: t(`${rows}.dailyAllowance`), value: formatCurrency(displayBudget(spendingMonthly, 'daily', daysInMonth), currency) },

    );



    switch (id) {

      case 'flexibleBudget':

        return {

          title: t(`${PREFIX}.flexibleBudget.title`),

          value: formatCurrency(displayAmount, currency),

          meaning: {

            title: shared.meaningTitle,

            body: financials.deductSavingsGoal && financials.savingsGoalDeduction > 0

              ? t(`${PREFIX}.flexibleBudget.meaningDeducted`)

              : t(`${PREFIX}.flexibleBudget.meaning`),

          },

          calculationTitle: shared.calculationTitle,

          rows: flexibleRows,

          formula: t(`${PREFIX}.flexibleBudget.formula`, {

            monthly: formatCurrency(spendingMonthly, currency),

            days: daysInMonth,

            daily: formatCurrency(displayBudget(spendingMonthly, 'daily', daysInMonth), currency),

          }),

        };

      case 'savingsGoal': {

        const savedDisplay = formatCurrency(totalSaved, currency);
        const period = t(`common.${frequency}`);
        const monthlyPace = hasOngoingSavingsGoal(inc)
          ? Number(inc.savingsMonthlyTarget) || 0
          : goalGap?.monthlyRequired ?? 0;
        const paceDisplay = formatDashboardAmount(monthlyPace, frequency, currency, daysInMonth);

        if (!hasTargetSavingsGoal(inc) && !hasOngoingSavingsGoal(inc)) {

          return {

            title: t(`${PREFIX}.savingsGoal.title`),

            value: savedDisplay,

            meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.savingsGoal.noGoalMeaning`) },

            calculationTitle: shared.calculationTitle,

            rows: [

              { label: t(`${PREFIX}.savingsGoal.rows.balance`), value: savedDisplay, emphasis: true },

            ],

            formula: null,

          };

        }

        if (hasOngoingSavingsGoal(inc)) {

          return {

            title: t(`${PREFIX}.savingsGoal.title`),

            value: savedDisplay,

            meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.savingsGoal.ongoingMeaning`) },

            calculationTitle: shared.calculationTitle,

            rows: [

              { label: t(`${PREFIX}.savingsGoal.rows.balance`), value: savedDisplay, emphasis: true },

              {

                label: t(`${PREFIX}.savingsGoal.rows.savePace`, { period }),

                value: paceDisplay,

                emphasis: true,

              },

              { label: t(`${PREFIX}.savingsGoal.rows.monthlyTarget`), value: formatCurrency(monthlyPace, currency) },

            ],

            formula: null,

          };

        }

        return {

          title: t(`${PREFIX}.savingsGoal.title`),

          value: savedDisplay,

          meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.savingsGoal.meaning`) },

          calculationTitle: shared.calculationTitle,

          rows: [

            { label: t(`${PREFIX}.savingsGoal.rows.target`), value: formatCurrency(inc.goalAmount, currency) },

            { label: t(`${PREFIX}.savingsGoal.rows.balance`), value: savedDisplay, emphasis: true },

            { label: t(`${PREFIX}.savingsGoal.rows.monthsLeft`), value: String(goalGap.monthsRemaining) },

            {

              label: t(`${PREFIX}.savingsGoal.rows.savePace`, { period }),

              value: paceDisplay,

              emphasis: true,

            },

            { label: t(`${PREFIX}.savingsGoal.rows.monthlyNeeded`), value: formatCurrency(goalGap.monthlyRequired, currency) },

            { label: t(`${rows}.flexibleBudget`), value: formatCurrency(financials.monthlyFlexible, currency) },

          ],

          formula: t(`${PREFIX}.savingsGoal.formula`),

          warning: !goalGap.achievable

            ? t('dashboard.goalsScreen.gap', {

              needed: formatCurrency(goalGap.monthlyRequired, currency),

              available: formatCurrency(financials.monthlyFlexible, currency),

            })

            : null,

        };

      }

      case 'totalIncome': {
        const userMonthly = toMonthly(inc?.amount || 0, inc?.frequency || 'monthly');
        const partnerMonthly = toMonthly(inc?.partnerAmount || 0, inc?.partnerFrequency || 'monthly');
        const incomeRows = [
          { label: t('onboarding.budget.budgetSplit.incomeUser'), value: formatCurrency(userMonthly, currency) },
          { label: t('onboarding.budget.budgetSplit.incomePartner'), value: formatCurrency(partnerMonthly, currency) },
        ];
        (inc?.otherIncomeRows || []).forEach((row, idx) => {
          const monthly = toMonthly(row.amount || 0, row.frequency || 'monthly');
          if (monthly > 0) {
            incomeRows.push({
              label: row.label || `${t('onboarding.budget.budgetSplit.incomeOther')} ${idx + 1}`,
              value: formatCurrency(monthly, currency),
            });
          }
        });
        incomeRows.push({
          label: t(`${PREFIX}.totalIncome.rows.total`),
          value: formatCurrency(financials.totalIncome, currency),
          emphasis: true,
        });
        return {
          title: t(`${PREFIX}.totalIncome.title`),
          value: formatCurrency(financials.totalIncome, currency),
          meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.totalIncome.meaning`) },
          calculationTitle: shared.calculationTitle,
          rows: incomeRows,
          formula: t(`${PREFIX}.totalIncome.formula`),
        };
      }

      case 'totalExpenses':
      case 'committedTotal':
        return {
          title: t(`${PREFIX}.totalExpenses.title`),
          value: formatCurrency(committedMonthlyLoad(financials), currency),
          meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.totalExpenses.meaning`) },
          calculationTitle: shared.calculationTitle,
          rows: [
            { label: t(`${rows}.fixedCosts`), value: formatCurrency(financials.fixedCosts, currency) },
            { label: t(`${rows}.debtPayments`), value: formatCurrency(financials.debtPayments, currency) },
            {
              label: t(`${PREFIX}.totalExpenses.rows.total`),
              value: formatCurrency(committedMonthlyLoad(financials), currency),
              emphasis: true,
            },
          ],
          formula: t(`${PREFIX}.totalExpenses.formula`),
        };

      case 'cashAfterBills': {
        const left = Number(financials.availableBudget) || 0;
        return {
          title: t(`${PREFIX}.cashAfterBills.title`),
          value: left < 0 ? `−${formatCurrency(Math.abs(left), currency)}` : formatCurrency(left, currency),
          meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.cashAfterBills.meaning`) },
          calculationTitle: shared.calculationTitle,
          rows: [
            { label: t(`${rows}.income`), value: formatCurrency(financials.totalIncome, currency) },
            { label: t(`${rows}.fixedCosts`), value: `−${formatCurrency(financials.fixedCosts, currency)}` },
            { label: t(`${rows}.debtPayments`), value: `−${formatCurrency(financials.debtPayments, currency)}` },
            {
              label: t(`${PREFIX}.cashAfterBills.rows.left`),
              value: left < 0 ? `−${formatCurrency(Math.abs(left), currency)}` : formatCurrency(left, currency),
              emphasis: true,
            },
          ],
          formula: t(`${PREFIX}.cashAfterBills.formula`),
          warning: left < 0 ? t('dashboard.home.health.status.overcommitted') : null,
        };
      }

      case 'savingsGoalPlan': {
        const { goalType } = normalizeIncomeGoalFields(inc);

        if (goalType === GOAL_TYPES.REDUCE_COSTS) {
          return {
            title: t(`${PREFIX}.savingsGoalPlan.title`),
            value: t('dashboard.home.kpi.reduceCosts'),
            meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.savingsGoalPlan.reduceCostsMeaning`) },
            calculationTitle: shared.calculationTitle,
            rows: [],
            formula: null,
          };
        }

        if (!hasTargetSavingsGoal(inc) && !hasOngoingSavingsGoal(inc)) {
          return {
            title: t(`${PREFIX}.savingsGoalPlan.title`),
            value: t('dashboard.home.kpi.noGoal'),
            meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.savingsGoalPlan.noGoalMeaning`) },
            calculationTitle: shared.calculationTitle,
            rows: [],
            formula: null,
          };
        }

        if (hasOngoingSavingsGoal(inc)) {
          return {
            title: t(`${PREFIX}.savingsGoalPlan.title`),
            value: formatCurrency(inc.savingsMonthlyTarget, currency),
            meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.savingsGoalPlan.ongoingMeaning`) },
            calculationTitle: shared.calculationTitle,
            rows: [
              {
                label: t(`${PREFIX}.savingsGoalPlan.rows.monthlyTarget`),
                value: formatCurrency(inc.savingsMonthlyTarget, currency),
                emphasis: true,
              },
              { label: t(`${PREFIX}.savingsGoalPlan.rows.schedule`), value: t('dashboard.home.kpi.goalMonthly') },
            ],
            formula: null,
          };
        }

        const deadline = formatDateDisplay(inc.goalDate, false, t);
        return {
          title: t(`${PREFIX}.savingsGoalPlan.title`),
          value: formatCurrency(inc.goalAmount, currency),
          meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.savingsGoalPlan.targetMeaning`) },
          calculationTitle: shared.calculationTitle,
          rows: [
            { label: t(`${PREFIX}.savingsGoalPlan.rows.goalAmount`), value: formatCurrency(inc.goalAmount, currency), emphasis: true },
            { label: t(`${PREFIX}.savingsGoalPlan.rows.deadline`), value: deadline },
            { label: t(`${PREFIX}.savingsGoal.rows.monthsLeft`), value: String(goalGap?.monthsRemaining ?? '—') },
            {
              label: t(`${PREFIX}.savingsGoal.rows.monthlyNeeded`),
              value: formatCurrency(goalGap?.monthlyRequired ?? 0, currency),
            },
            { label: t(`${PREFIX}.savingsGoal.rows.balance`), value: formatCurrency(totalSaved, currency) },
          ],
          formula: t(`${PREFIX}.savingsGoal.formula`),
          warning: goalGap && !goalGap.achievable
            ? t('dashboard.goalsScreen.gap', {
              needed: formatCurrency(goalGap.monthlyRequired, currency),
              available: formatCurrency(financials.monthlyFlexible, currency),
            })
            : null,
        };
      }

      case 'fixedLoad':

        return {

          title: t(`${PREFIX}.fixedLoad.title`),

          value: `${fixedLoadPct}%`,

          meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.fixedLoad.meaning`) },

          calculationTitle: shared.calculationTitle,

          rows: [

            { label: t(`${rows}.fixedCosts`), value: formatCurrency(financials.fixedCosts, currency) },

            { label: t(`${rows}.debtPayments`), value: formatCurrency(financials.debtPayments, currency) },

            { label: t(`${rows}.totalCommitted`), value: formatCurrency(fixedLoad, currency), emphasis: true },

            { label: t(`${rows}.income`), value: formatCurrency(financials.totalIncome, currency) },

            { label: t(`${rows}.fixedLoadPct`), value: `${fixedLoadPct}%`, emphasis: true },

          ],

          formula: t(`${PREFIX}.fixedLoad.formula`),

          warning: fixedLoadStatus === 'overcommitted'

            ? t('dashboard.home.health.status.overcommitted')

            : fixedLoadStatus === 'tight'

              ? t('dashboard.home.health.status.tight')

              : null,

        };

      case 'monthlyBuffer':

        return {

          title: t(`${PREFIX}.monthlyBuffer.title`),

          value: surplus < 0 ? `−${formatCurrency(Math.abs(surplus), currency)}` : formatCurrency(surplus, currency),

          meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.monthlyBuffer.meaning`) },

          calculationTitle: shared.calculationTitle,

          rows: [

            { label: t(`${rows}.income`), value: formatCurrency(financials.totalIncome, currency) },

            { label: t(`${rows}.fixedCosts`), value: `−${formatCurrency(financials.fixedCosts, currency)}` },

            { label: t(`${rows}.debtPayments`), value: `−${formatCurrency(financials.debtPayments, currency)}` },

            { label: t(`${rows}.available`), value: formatCurrency(financials.availableBudget, currency) },

            { label: t(`${rows}.flexibleBudget`), value: `−${formatCurrency(financials.monthlyFlexible, currency)}` },

            {

              label: t(`${rows}.buffer`),

              value: surplus < 0 ? `−${formatCurrency(Math.abs(surplus), currency)}` : formatCurrency(surplus, currency),

              emphasis: true,

            },

          ],

          formula: t(`${PREFIX}.monthlyBuffer.formula`),

          warning: insights.flags.negativeSurplus ? t('dashboard.home.health.status.deficit') : null,

        };

      case 'recurring':

        return {

          title: t(`${PREFIX}.recurringCosts.title`),

          value: `${recurringPct}%`,

          meaning: { title: shared.meaningTitle, body: t(`${PREFIX}.recurringCosts.meaning`) },

          calculationTitle: shared.calculationTitle,

          rows: [

            { label: t(`${rows}.recurringTotal`), value: formatCurrency(insights.recurringMonthly, currency), emphasis: true },

            { label: t(`${rows}.income`), value: formatCurrency(financials.totalIncome, currency) },

            { label: t(`${rows}.recurringPct`), value: `${recurringPct}%`, emphasis: true },

          ],

          formula: t(`${PREFIX}.recurringCosts.formula`),

        };

      default:

        return null;

    }

  }, [

    financials,

    insights,

    inc,

    goalGap,

    currency,

    daysInMonth,

    frequency,

    fixedLoad,

    fixedLoadPct,

    recurringPct,

    surplus,

    fixedLoadStatus,

    availableAfterBills,

    totalSaved,

    locale,

    t,

  ]);



  const active = activeMetric ? buildModal(activeMetric) : null;

  const navIconProps = cardVariant === 'glass'
    ? { color: 'rgba(255, 255, 255, 0.78)', size: 16 }
    : { color: C.muted, size: 16 };

  const metricCardVariant = cardVariant === 'glass' ? 'glass' : undefined;

  const infoA11y = t(`${PREFIX}.infoA11y`);



  return (

    <View style={{ marginBottom: cardVariant === 'glass' || embedded ? 0 : S.sectionGap }}>

      {showHeroPanels ? (

      <View style={{

        flexDirection: stackHero ? 'column' : 'row',

        gap: 12,

        ...(Platform.OS === 'web' ? { display: 'flex' } : {}),

      }}>

        <MetricExplainCard

          variant="hero-panel"

          style={{ flex: 1 }}

          label={t('dashboard.home.spendingBudget')}

          labelIcon={<BudgetIcon {...navIconProps} />}

          value={spendingValue}

          amountValue={spendingAmountValue}

          amountCurrency={currency}

          valueAnimationKey={frequency}

          footerLabel={financials.deductSavingsGoal && financials.savingsGoalDeduction > 0

            ? t('dashboard.home.spendingBudgetNoteDeducted', {

              spend: formatCurrency(spendingMonthly, currency),

              goal: formatCurrency(financials.savingsGoalDeduction, currency),

            })

            : t('dashboard.home.spendingBudgetNote', {

              amount: formatCurrency(financials.monthlyFlexible, currency),

            })}

          frequencyControl={(
            <DashboardFrequencyDropdown value={frequency} onChange={setFrequency} compact />
          )}

          onPress={() => goToTab('flexibleBudget')}

          onInfoPress={() => setActiveMetric('flexibleBudget')}

          infoAccessibilityLabel={infoA11y}

        />

        <MetricExplainCard

          variant="hero-panel"

          style={{ flex: 1 }}

          label={t('dashboard.home.goalTracking.title')}

          labelIcon={<GoalsIcon {...navIconProps} />}

          value={goalPanel.value}

          amountValue={goalPanel.amountValue}

          amountCurrency={currency}

          valueAnimationKey={frequency}

          footerLabel={goalPanel.footerLabel}

          frequencyControl={goalPanel.showFrequency ? (
            <DashboardFrequencyDropdown value={frequency} onChange={setFrequency} compact />
          ) : null}

          onPress={() => goToTab('savingsGoal')}

          onInfoPress={() => setActiveMetric('savingsGoal')}

          infoAccessibilityLabel={infoA11y}

        />

      </View>

      ) : null}



      {showHeroPanels ? (

        <DashboardSnapshotGrid

          financials={financials}

          insights={insights}

          currency={currency}

          stackHero={stackHero}

          onNavigate={(route) => navigateFromDashboard(router, route)}

          onOpenMetric={setActiveMetric}

          infoA11y={infoA11y}

        />

      ) : null}



      {secondaryMetricIds.length > 0 ? (

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: showHeroPanels ? 12 : 0 }}>

        {secondaryMetricIds.map((id) => {
          const isQuadGrid = secondaryMetricIds.length === 4;
          const cellStyle = isPhone
            ? { width: '100%', flexBasis: '100%', minWidth: 0 }
            : isQuadGrid
              ? { width: '47%', flexGrow: 1, flexBasis: '45%' }
              : { flex: 1, minWidth: 140 };
          return (
          <View
            key={id}
            style={cellStyle}
          >

            <MetricExplainCard

              variant={metricCardVariant}

              label={metrics[id].label}

              labelIcon={

                id === 'monthlyBuffer'

                  ? <BudgetIcon {...navIconProps} />

                  : <CostsIcon {...navIconProps} />

              }

              value={metrics[id].value}

              amountValue={metrics[id].amountValue}

              amountCurrency={currency}

              footerLabel={metrics[id].footerLabel}

              statusLabel={metrics[id].statusLabel}

              statusColor={
                cardVariant === 'glass' && metrics[id].statusColor === C.danger
                  ? '#FCA5A5'
                  : metrics[id].statusColor
              }

              onPress={() => goToTab(id)}

              onInfoPress={() => setActiveMetric(id)}

              infoAccessibilityLabel={infoA11y}

            />

          </View>
          );
        })}

      </View>

      ) : null}



      {active ? (

        <MetricExplainModal

          visible={!!activeMetric}

          onClose={() => setActiveMetric(null)}

          title={active.title}

          value={active.value}

          meaning={active.meaning}

          calculationTitle={active.calculationTitle}

          rows={active.rows}

          formula={active.formula}

          warning={active.warning}

          gotItLabel={t(`${PREFIX}.gotIt`)}

          accessibilityLabel={t(`${PREFIX}.closeA11y`)}

        />

      ) : null}

    </View>

  );

}

