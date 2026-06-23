import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { getData } from '../../lib/storage';
import { toMonthly, formatCurrency, totalMonthlyCosts, availableBudget, displayBudget, effectiveSpendingBudget } from '../../lib/finance';
import { amountToString } from '../../lib/sectionEditStorage';
import { aggregateHouseholdCosts, computeTotalMonthlyIncome } from '../../lib/householdBudget';
import { computeGoalGap } from '../../lib/insights';
import { getMonthlySavingsReservation } from '../../lib/incomeGoals';
import { splitFlexibleBudget } from '../../lib/budgetSplit';
import BudgetSplitSlider from '../../components/onboarding/BudgetSplitSlider';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import { getCurrencySymbol } from '../../lib/currency';
import { buildBudgetExportRows, exportBudgetCsv, exportBudgetXlsx, exportBudgetPdf } from '../../lib/budgetExport';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import BudgetSetupSummaryTable from '../../components/onboarding/BudgetSetupSummaryTable';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import FinanceAppPanaIllustration from '../../components/onboarding/FinanceAppPanaIllustration';
import { C, T, R, tabularNums } from '../../constants/onboarding-theme';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import { patchOnboardingState } from '../../lib/onboardingProgress';
import {
  persistBudgetSplitDraft,
  resolveFlexibleMonthly,
  resolveOnboardingSpendingRatio,
} from '../../lib/budgetOnboardingSave';

function getIncomeBreakdownItems(income, t) {
  const userMonthly = toMonthly(income?.amount || 0, income?.frequency || 'monthly');
  const partnerMonthly = toMonthly(income?.partnerAmount || 0, income?.partnerFrequency || 'monthly');
  const breakdowns = [];
  if (userMonthly > 0) {
    breakdowns.push({ label: t('onboarding.budget.budgetSplit.incomeUser'), amount: userMonthly, indent: 28 });
  }
  if (partnerMonthly > 0) {
    breakdowns.push({ label: t('onboarding.budget.budgetSplit.incomePartner'), amount: partnerMonthly, indent: 28 });
  }
  (income?.otherIncomeRows || []).forEach((r, idx) => {
    const monthly = toMonthly(r.amount || 0, r.frequency || 'monthly');
    if (monthly > 0) {
      breakdowns.push({
        label: r.label || `${t('onboarding.budget.budgetSplit.incomeOther')} ${idx + 1}`,
        amount: monthly,
        indent: 28,
      });
    }
  });
  return breakdowns;
}

export default function BudgetScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const { isEditMode, leaveSection, editContinueLabel } = useSectionExit();

  const [validationError, setValidationError] = useState('');

  // Financial data for live calculation
  const [income, setIncome] = useState(null);
  const [costs, setCosts] = useState([]);
  const [costsByCategory, setCostsByCategory] = useState([]);
  const [debts, setDebts] = useState([]);
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  // budgetSplit — Monthly budget
  const [monthlyFlexible, setMonthlyFlexible] = useState('');
  const [calculatedBudget, setCalculatedBudget] = useState(0);
  const [budgetDisplayFrequency, setBudgetDisplayFrequency] = useState('daily');
  const [budgetSpendingRatio, setBudgetSpendingRatio] = useState(1);

  // budgetSplit — Savings goal deduction preference
  const [deductSavingsGoal, setDeductSavingsGoal] = useState(false);

  const [tableVisible, setTableVisible] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    (async () => {
      setDataLoading(true);
      setDataError('');
      try {
      const inc = await getData('beaverr_income');
      const d = await getData('beaverr_debts') || [];
      const loc = await getData('beaverr_location');
      if (loc?.currency) setCurrencyCode(loc.currency);
      setIncome(inc);
      setDebts(d);

      const household = await getData('beaverr_household') || {};
      const housing = await getData('beaverr_housing') || {};
      const transport = await getData('beaverr_transport') || {};
      const health = await getData('beaverr_health') || {};
      const childrenCosts = await getData('beaverr_children_costs') || {};
      const pets = await getData('beaverr_pets') || [];
      const subs = await getData('beaverr_subscriptions') || [];
      const otherCosts = await getData('beaverr_other_costs') || [];

      const { allCosts, byCategory } = aggregateHouseholdCosts({
        housing,
        transport,
        health,
        childrenCosts,
        pets,
        subs,
        otherCosts,
        household,
      }, t);

      setCosts(allCosts);
      setCostsByCategory(byCategory);

      // Calculate available budget
      const totalIncome = computeTotalMonthlyIncome(inc);

      // Fixed costs from all aggregated costs
      const fixedCosts = totalMonthlyCosts(allCosts);

      // Min debt payments
      const debtPayments = d.reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0);

      const avail = availableBudget(totalIncome, fixedCosts, debtPayments);
      setCalculatedBudget(avail);
      // Always derive flexible budget from live income/costs on this screen — not a stale saved value
      setMonthlyFlexible(amountToString(avail));

      const savedBudget = await getData('beaverr_budget');
      if (savedBudget?.budgetDisplayFrequency) {
        setBudgetDisplayFrequency(savedBudget.budgetDisplayFrequency);
      }
      if (savedBudget?.deductSavingsGoal === true) {
        setDeductSavingsGoal(true);
      }
      if (savedBudget) {
        setBudgetSpendingRatio(resolveOnboardingSpendingRatio(savedBudget, avail));
      }

      if (savedBudget?.budgetOnboardingStep === 'flexible-budget') {
        navigateForward('/(onboarding)/budget-rollover');
        return;
      }

      // Show the table with animation once data is ready
      setTableVisible(true);
      } catch {
        setDataError(t('onboarding.budget.budgetSplit.loadError'));
        setTableVisible(false);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [reloadKey, t, router]);

  const buildBudgetSplitDraft = () => ({
    monthlyFlexible,
    income,
    costs,
    debts,
    budgetSpendingRatio,
    budgetDisplayFrequency,
    deductSavingsGoal,
  });

  const handleSaveDraft = async () => {
    await persistBudgetSplitDraft(buildBudgetSplitDraft());
  };

  const handleContinue = async () => {
    setValidationError('');

    if (dataLoading || dataError) return;

    const flexMonthly = resolveFlexibleMonthly(buildBudgetSplitDraft());
    if (!Number.isFinite(flexMonthly)) {
      setValidationError(t('onboarding.budget.budgetSplit.validation'));
      return;
    }

    setMonthlyFlexible(amountToString(flexMonthly));
    setCalculatedBudget(flexMonthly);

    await persistBudgetSplitDraft(buildBudgetSplitDraft());
    await patchOnboardingState({
      completed: false,
      currentStep: 'budget',
      percentComplete: 95,
      resumeRoute: '/(onboarding)/budget-rollover',
    });
    router.push('/(onboarding)/budget-rollover');
  };

  const handleBack = () => {
    setValidationError('');
    leaveSection(() => navigateBack());
  };

  const progress = 95;
  const screenProgress = isEditMode ? undefined : progress;

  const renderBudgetSplit = () => {
    const userMonthly = toMonthly(income?.amount || 0, income?.frequency || 'monthly');
    const partnerMonthly = toMonthly(income?.partnerAmount || 0, income?.partnerFrequency || 'monthly');
    const otherMonthly = (income?.otherIncomeRows || []).reduce((sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'), 0);
    const totalIncome = userMonthly + partnerMonthly + otherMonthly;
    const fixedCosts = totalMonthlyCosts(costs);
    const debtPayments = debts.reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0);
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
    const hasIncomeBreakdown = incomeBreakdowns.length > 0;

    const rows = [
      {
        key: 'income',
        label: t('onboarding.budget.budgetSplit.income'),
        amount: totalIncome,
        expandable: hasIncomeBreakdown,
      },
      {
        key: 'fixedCosts',
        label: t('onboarding.budget.budgetSplit.fixedCosts'),
        amount: -fixedCosts,
        expandable: true,
      },
      {
        key: 'debtPayments',
        label: t('onboarding.budget.budgetSplit.debtPayments'),
        amount: -debtPayments,
        expandable: false,
      },
    ];

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
            onPress={() => setReloadKey((k) => k + 1)}
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

    const incomeBreakdownExport = incomeBreakdowns.map(({ label, amount }) => ({ label, amount }));

    const exportRows = buildBudgetExportRows({
      summaryRows: rows,
      incomeBreakdown: incomeBreakdownExport,
      costsByCategory: costsByCategory.map((cat) => ({
        label: cat.label,
        items: cat.items.map((item) => ({
          label: item.label,
          amount: toMonthly(item.amount || 0, item.frequency || 'monthly'),
        })),
      })),
      totalBudget: liveFlexibleMonthly,
      currency,
      totalLabel: t('onboarding.budget.budgetSplit.budgetLabel'),
    });

    const exportMeta = {
      title: t('onboarding.budget.budgetSplit.title'),
      summaryTitle: t('onboarding.budget.budgetSplit.summaryTitle'),
      amountTitle: t('onboarding.budget.budgetSplit.amount'),
      currency,
    };

    const handleExportCsv = () => exportBudgetCsv(exportRows, exportMeta);
    const handleExportXlsx = () => exportBudgetXlsx(exportRows, exportMeta);
    const handleExportPdf = () => exportBudgetPdf(exportRows, exportMeta);

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
              onChange={setDeductSavingsGoal}
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
        }}>
          <FrequencyPills
            options={['daily', 'weekly', 'monthly']}
            value={budgetDisplayFrequency}
            onChange={setBudgetDisplayFrequency}
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
                onChange={setBudgetSpendingRatio}
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
          }}>
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
  };

  return (
    <QuestionScreen
      illustration={<FinanceAppPanaIllustration width={layout.illustrationWidth} />}
      chapter={t('onboarding.budget.chapter')}
      title={t('onboarding.budget.budgetSplit.title')}
      helper={t('onboarding.budget.budgetSplit.helper')}
      onContinue={handleContinue}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      validationError={validationError}
        setValidationError={setValidationError}
      continueDisabled={dataLoading || !!dataError}
      continueLabel={editContinueLabel}
      animationKey="budgetSplit"
      resumeRoute="/(onboarding)/budget-setup"
      exitPatch={{ currentStep: 'budget', percentComplete: 95 }}
    >
      {renderBudgetSplit()}
    </QuestionScreen>
  );
}
