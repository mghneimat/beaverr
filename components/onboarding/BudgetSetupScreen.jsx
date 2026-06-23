import { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { getData } from '../../lib/storage';
import { asArray } from '../../lib/asArray';
import { normalizeCostsByCategory, normalizeIncomePayload } from '../../lib/normalizeBudgetData';
import { totalMonthlyCosts, availableBudget } from '../../lib/finance';
import { amountToString } from '../../lib/sectionEditStorage';
import { aggregateHouseholdCosts, computeTotalMonthlyIncome } from '../../lib/householdBudget';
import { getCurrencySymbol } from '../../lib/currency';
import BudgetSetupForm from './BudgetSetupForm';
import QuestionScreen from './QuestionScreen';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import { patchOnboardingState } from '../../lib/onboardingProgress';
import {
  persistBudgetSplitDraft,
  resolveFlexibleMonthly,
  resolveOnboardingSpendingRatio,
} from '../../lib/budgetOnboardingSave';

export default function BudgetSetupScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();
  const { leaveSection, editContinueLabel } = useSectionExit();

  const [validationError, setValidationError] = useState('');

  const [income, setIncome] = useState(null);
  const [costs, setCosts] = useState([]);
  const [costsByCategory, setCostsByCategory] = useState([]);
  const [debts, setDebts] = useState([]);
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  const [monthlyFlexible, setMonthlyFlexible] = useState('');
  const [budgetDisplayFrequency, setBudgetDisplayFrequency] = useState('daily');
  const [budgetSpendingRatio, setBudgetSpendingRatio] = useState(1);
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
        const d = asArray(await getData('beaverr_debts'));
        const loc = await getData('beaverr_location');
        if (loc?.currency) setCurrencyCode(loc.currency);
        setIncome(normalizeIncomePayload(inc));
        setDebts(d);

        const household = await getData('beaverr_household') || {};
        const housing = await getData('beaverr_housing') || {};
        const transport = await getData('beaverr_transport') || {};
        const health = await getData('beaverr_health') || {};
        const childrenCosts = await getData('beaverr_children_costs') || {};
        const pets = asArray(await getData('beaverr_pets'));
        const subs = asArray(await getData('beaverr_subscriptions'));
        const otherCosts = asArray(await getData('beaverr_other_costs'));

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
        setCostsByCategory(normalizeCostsByCategory(byCategory));

        const totalIncome = computeTotalMonthlyIncome(inc);
        const fixedCosts = totalMonthlyCosts(allCosts);
        const debtPayments = d.reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0);
        const avail = availableBudget(totalIncome, fixedCosts, debtPayments);
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

        setTableVisible(true);
      } catch {
        setDataError(t('onboarding.budget.budgetSplit.loadError'));
        setTableVisible(false);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [reloadKey, t]);

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

    await persistBudgetSplitDraft(buildBudgetSplitDraft());
    await patchOnboardingState({
      completed: false,
      currentStep: 'budget',
      percentComplete: 95,
      resumeRoute: '/(onboarding)/budget-rollover',
    });
    navigateForward('/(onboarding)/budget-rollover');
  };

  const handleBack = () => {
    setValidationError('');
    leaveSection(() => navigateBack());
  };

  const renderBody = () => (
    <BudgetSetupForm
        t={t}
        layout={layout}
        currency={currency}
        income={income}
        costs={costs}
        costsByCategory={costsByCategory}
        debts={debts}
        dataLoading={dataLoading}
        dataError={dataError}
        onRetry={() => setReloadKey((k) => k + 1)}
        tableVisible={tableVisible}
        budgetDisplayFrequency={budgetDisplayFrequency}
        onBudgetDisplayFrequencyChange={setBudgetDisplayFrequency}
        budgetSpendingRatio={budgetSpendingRatio}
        onBudgetSpendingRatioChange={setBudgetSpendingRatio}
        deductSavingsGoal={deductSavingsGoal}
        onDeductSavingsGoalChange={setDeductSavingsGoal}
    />
  );

  return (
    <QuestionScreen
      illustration={layout.surfaceVariant === 'card' ? undefined : null}
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
      {renderBody()}
    </QuestionScreen>
  );
}
