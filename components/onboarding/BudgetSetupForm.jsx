import { View, Text } from 'react-native';
import OnboardingPressable from './OnboardingPressable';
import BudgetSplitSlider from './BudgetSplitSlider';
import YesNoToggle from './YesNoToggle';
import AnimatedSlideIn from './AnimatedSlideIn';
import FrequencyPills from './FrequencyPills';
import BudgetSetupSummaryTable from './BudgetSetupSummaryTable';
import { toMonthly, formatCurrency, totalMonthlyCosts, availableBudget, displayBudget, effectiveSpendingBudget } from '../../lib/finance';
import { buildBudgetExportRows } from '../../lib/budgetExportRows';
import { asArray } from '../../lib/asArray';
import { computeGoalGap } from '../../lib/insights';
import { getMonthlySavingsReservation } from '../../lib/incomeGoals';
import { splitFlexibleBudget } from '../../lib/budgetSplit';
import { C, T, R, tabularNums } from '../../constants/onboarding-theme';

function getIncomeBreakdownItems(income, t) {
  const userMonthly = toMonthly(income?.amount || 0, income?.frequency || 'monthly');
  const partnerMonthly = toMonthly(income?.partnerAmount || 0, income?.partnerFrequency || 'monthly');
  const breakdowns = [];
  if (userMonthly > 0) {
    breakdowns.push({ label: t('onboarding.budget.budgetSplit.incomeUser'), amount: userMonthly });
  }
  if (partnerMonthly > 0) {
    breakdowns.push({ label: t('onboarding.budget.budgetSplit.incomePartner'), amount: partnerMonthly });
  }
  asArray(income?.otherIncomeRows).forEach((r, idx) => {
    const monthly = toMonthly(r.amount || 0, r.frequency || 'monthly');
    if (monthly > 0) {
      breakdowns.push({
        label: r.label || `${t('onboarding.budget.budgetSplit.incomeOther')} ${idx + 1}`,
        amount: monthly,
      });
    }
  });
  return breakdowns;
}

/**
 * Heavy budget-setup form — lazy-loaded so the route shell mounts before dashboard table deps.
 */
export default function BudgetSetupForm({
  t,
  layout,
  currency,
  income,
  costs,
  costsByCategory,
  debts,
  dataLoading,
  dataError,
  onRetry,
  tableVisible,
  budgetDisplayFrequency,
  onBudgetDisplayFrequencyChange,
  budgetSpendingRatio,
  onBudgetSpendingRatioChange,
  deductSavingsGoal,
  onDeductSavingsGoalChange,
}) {
  const userMonthly = toMonthly(income?.amount || 0, income?.frequency || 'monthly');
  const partnerMonthly = toMonthly(income?.partnerAmount || 0, income?.partnerFrequency || 'monthly');
  const otherMonthly = asArray(income?.otherIncomeRows).reduce((sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'), 0);
  const totalIncome = userMonthly + partnerMonthly + otherMonthly;
  const fixedCosts = totalMonthlyCosts(costs);
  const debtPayments = asArray(debts).reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0);
  const liveFlexibleMonthly = availableBudget(totalIncome, fixedCosts, debtPayments);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const goalGap = computeGoalGap({ income, monthlyFlexible: liveFlexibleMonthly });
  const monthlySavingsRequired = getMonthlySavingsReservation(income, goalGap);
  const hasSavingsGoal = monthlySavingsRequired > 0;
  const { spendingMonthly, savingsShift } = splitFlexibleBudget(liveFlexibleMonthly, budgetSpendingRatio);
  const effectiveMonthly = effectiveSpendingBudget(
    spendingMonthly,
    monthlySavingsRequired,
    deductSavingsGoal === true,
  );
  const previewAmount = displayBudget(effectiveMonthly, budgetDisplayFrequency, daysInMonth);
  const incomeBreakdowns = getIncomeBreakdownItems(income, t);

  if (dataLoading) {
    return (
      <View accessibilityRole="progressbar" accessibilityLabel={t('onboarding.budget.budgetSplit.loading')}>
        <Text style={{ ...T.helper, color: C.muted }}>{t('onboarding.budget.budgetSplit.loading')}</Text>
      </View>
    );
  }

  if (dataError) {
    return (
      <View>
        <Text style={{ ...T.helper, color: C.danger, marginBottom: 16 }}>{dataError}</Text>
        <OnboardingPressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={t('common.retry')}
          style={({ pressed, hovered }) => ({
            alignSelf: 'flex-start',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: R.button,
            backgroundColor: pressed || hovered ? C.accentPressed : C.accent,
            minHeight: 44,
            justifyContent: 'center',
          })}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>{t('common.retry')}</Text>
        </OnboardingPressable>
      </View>
    );
  }

  const buildExportPayload = () => {
    const exportRows = buildBudgetExportRows({
      summaryRows: [
        { key: 'income', label: t('onboarding.budget.budgetSplit.income'), amount: totalIncome, expandable: incomeBreakdowns.length > 0 },
        { key: 'fixedCosts', label: t('onboarding.budget.budgetSplit.fixedCosts'), amount: -fixedCosts, expandable: asArray(costsByCategory).length > 0 },
        { key: 'debtPayments', label: t('onboarding.budget.budgetSplit.debtPayments'), amount: -debtPayments, expandable: false },
      ],
      incomeBreakdown: incomeBreakdowns.map(({ label, amount }) => ({ label, amount })),
      costsByCategory: asArray(costsByCategory).map((cat) => ({
        label: cat.label,
        items: asArray(cat.items).map((item) => ({
          label: item.label,
          amount: toMonthly(item.amount || 0, item.frequency || 'monthly'),
        })),
      })),
      totalBudget: liveFlexibleMonthly,
      currency,
      totalLabel: t('onboarding.budget.budgetSplit.budgetLabel'),
    });

    return {
      rows: exportRows,
      meta: {
        title: t('onboarding.budget.budgetSplit.title'),
        summaryTitle: t('onboarding.budget.budgetSplit.summaryTitle'),
        amountTitle: t('onboarding.budget.budgetSplit.amount'),
        currency,
      },
    };
  };

  const handleExportCsv = async () => {
    const { rows, meta } = buildExportPayload();
    const { exportBudgetCsv } = await import('../../lib/budgetExport');
    await exportBudgetCsv(rows, meta);
  };
  const handleExportXlsx = async () => {
    const { rows, meta } = buildExportPayload();
    const { exportBudgetXlsx } = await import('../../lib/budgetExport');
    await exportBudgetXlsx(rows, meta);
  };
  const handleExportPdf = async () => {
    const { rows, meta } = buildExportPayload();
    const { exportBudgetPdf } = await import('../../lib/budgetExport');
    await exportBudgetPdf(rows, meta);
  };

  return (
    <View>
      <AnimatedSlideIn visible={tableVisible} duration={400}>
        <BudgetSetupSummaryTable
          t={t}
          currency={currency}
          totalIncome={totalIncome}
          fixedCosts={fixedCosts}
          debtPayments={debtPayments}
          totalBudget={liveFlexibleMonthly}
          incomeBreakdowns={incomeBreakdowns}
          costsByCategory={costsByCategory}
          onExportCsv={handleExportCsv}
          onExportXlsx={handleExportXlsx}
          onExportPdf={handleExportPdf}
        />
      </AnimatedSlideIn>

      {hasSavingsGoal ? (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
            {t('onboarding.budget.budgetSplit.deductSavingsGoal.label')}
          </Text>
          <Text style={{ ...T.helper, color: C.muted, marginBottom: 12 }}>
            {t('onboarding.budget.budgetSplit.deductSavingsGoal.helper')}
          </Text>
          <YesNoToggle
            value={deductSavingsGoal}
            onChange={onDeductSavingsGoalChange}
            yesLabel={t('onboarding.budget.budgetSplit.deductSavingsGoal.yes')}
            noLabel={t('onboarding.budget.budgetSplit.deductSavingsGoal.no')}
          />
        </View>
      ) : null}

      <View
        accessibilityLabel={t('onboarding.budget.budgetSplit.a11y.previewAmount', {
          frequency: t(`onboarding.budget.budgetSplit.previewLabel.${budgetDisplayFrequency}`),
        })}
        style={{
          marginBottom: 20,
          padding: 20,
          borderRadius: R.card,
          backgroundColor: C.surface,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <FrequencyPills
          options={['daily', 'weekly', 'monthly']}
          value={budgetDisplayFrequency}
          onChange={onBudgetDisplayFrequencyChange}
          label={t('onboarding.budget.budgetSplit.displayFrequencyLabel')}
          small
          containerStyle={{ marginBottom: 16 }}
        />

        {liveFlexibleMonthly > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ ...T.fieldLabel, marginBottom: 6 }}>
              {t('onboarding.budget.budgetSplit.splitSlider.label')}
            </Text>
            <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
              {t('onboarding.budget.budgetSplit.splitSlider.helper')}
            </Text>
            <BudgetSplitSlider
              value={budgetSpendingRatio}
              onChange={onBudgetSpendingRatioChange}
              totalAvailable={liveFlexibleMonthly}
            />
            {savingsShift > 0 ? (
              <Text style={{ ...T.caption, color: C.muted, marginTop: 10 }}>
                {t('onboarding.budget.budgetSplit.splitSlider.summary', {
                  spend: formatCurrency(effectiveMonthly, currency),
                  savings: formatCurrency(savingsShift, currency),
                })}
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text style={{
          fontSize: layout.previewFontSize,
          fontWeight: '700',
          color: effectiveMonthly >= 0 ? C.primary : C.danger,
          ...tabularNums,
        }}
        >
          {formatCurrency(previewAmount, currency)}
        </Text>
        <Text style={{ ...T.helper, color: C.muted, marginTop: 12 }}>
          {t('onboarding.budget.budgetSplit.displayHelper')}
        </Text>
        {hasSavingsGoal && deductSavingsGoal ? (
          <Text style={{ ...T.helper, color: C.muted, marginTop: 8 }}>
            {t('onboarding.budget.budgetSplit.deductSavingsGoal.previewNote', {
              deduction: formatCurrency(monthlySavingsRequired, currency),
              amount: formatCurrency(effectiveMonthly, currency),
            })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
