import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { getData, setData } from '../../lib/storage';
import { aggregateHouseholdCosts } from '../../lib/householdBudget';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import OptionCard from '../../components/onboarding/OptionCard';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import FinanceAppPanaIllustration from '../../components/onboarding/FinanceAppPanaIllustration';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import {
  persistFinalBudgetOnboarding,
  resolveFlexibleMonthly,
} from '../../lib/budgetOnboardingSave';
import { amountToString } from '../../lib/sectionEditStorage';
import {
  DAILY_SPENDING_STRATEGIES,
  DEFAULT_DAILY_SPENDING_DESTINATION,
  normalizeDailySpendingDestination,
} from '../../lib/dailySpendingStrategy';
import { normalizeResetDestination } from '../../lib/monthEndRouting';
import { migrateBudgetPolicy } from '../../lib/budgetMigration';

export default function BudgetSpendingStrategyScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const { completeSection } = useSectionExit();

  const [validationError, setValidationError] = useState('');

  const [income, setIncome] = useState(null);
  const [costs, setCosts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [monthlyFlexible, setMonthlyFlexible] = useState('');
  const [budgetDisplayFrequency, setBudgetDisplayFrequency] = useState('daily');
  const [budgetSpendingRatio, setBudgetSpendingRatio] = useState(1);
  const [deductSavingsGoal, setDeductSavingsGoal] = useState(false);

  const [rolloverStrategy, setRolloverStrategy] = useState(null);
  const [resetUnspentDestination, setResetUnspentDestination] = useState('looseMoney');
  const [resetOtherGoalNote, setResetOtherGoalNote] = useState('');

  const [dailyJarDestination, setDailyJarDestination] = useState(DEFAULT_DAILY_SPENDING_DESTINATION);

  useEffect(() => {
    (async () => {
      const inc = await getData('beaverr_income');
      const d = await getData('beaverr_debts') || [];
      const rawBudget = await getData('beaverr_budget') || {};
      const { budget: savedBudget } = migrateBudgetPolicy(rawBudget);
      const household = await getData('beaverr_household') || {};
      const housing = await getData('beaverr_housing') || {};
      const transport = await getData('beaverr_transport') || {};
      const health = await getData('beaverr_health') || {};
      const childrenCosts = await getData('beaverr_children_costs') || {};
      const pets = await getData('beaverr_pets') || [];
      const subs = await getData('beaverr_subscriptions') || [];
      const otherCosts = await getData('beaverr_other_costs') || [];

      setIncome(inc);
      setDebts(d);

      const { allCosts } = aggregateHouseholdCosts({
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

      if (savedBudget?.monthlyFlexible != null) {
        setMonthlyFlexible(amountToString(savedBudget.monthlyFlexible));
      }
      if (savedBudget?.budgetDisplayFrequency) {
        setBudgetDisplayFrequency(savedBudget.budgetDisplayFrequency);
      }
      if (savedBudget?.budgetSpendingRatio != null) {
        setBudgetSpendingRatio(savedBudget.budgetSpendingRatio);
      }
      if (savedBudget?.deductSavingsGoal === true) {
        setDeductSavingsGoal(true);
      }
      if (savedBudget?.rolloverStrategy) {
        setRolloverStrategy(savedBudget.rolloverStrategy);
      }
      if (savedBudget?.resetUnspentDestination) {
        setResetUnspentDestination(normalizeResetDestination(savedBudget.resetUnspentDestination));
      }
      if (savedBudget?.resetOtherGoalNote) {
        setResetOtherGoalNote(savedBudget.resetOtherGoalNote);
      }

      if (savedBudget?.dailyJarDestination) {
        setDailyJarDestination(normalizeDailySpendingDestination(savedBudget.dailyJarDestination));
      }

      if (!savedBudget?.rolloverStrategy) {
        navigateForward('/(onboarding)/budget-rollover');
      } else if (
        savedBudget?.budgetOnboardingStep !== 'spending-strategy'
        && savedBudget?.budgetOnboardingStep !== 'flexible-budget'
        && savedBudget?.monthlyFlexible == null
      ) {
        navigateForward('/(onboarding)/budget-setup');
      }
    })();
  }, [router, t]);

  const handleSaveDraft = async () => {
    const existing = (await getData('beaverr_budget')) || {};
    await setData('beaverr_budget', {
      ...existing,
      dailyJarEnabled: true,
      dailyJarDestination: dailyJarDestination || DEFAULT_DAILY_SPENDING_DESTINATION,
      budgetOnboardingStep: 'spending-strategy',
    });
  };

  const handleContinue = async () => {
    setValidationError('');

    if (!dailyJarDestination) {
      setValidationError(t('onboarding.budget.spendingStrategy.validation'));
      return;
    }

    const draft = {
      monthlyFlexible,
      income,
      costs,
      debts,
      budgetSpendingRatio,
      budgetDisplayFrequency,
      deductSavingsGoal,
      rolloverStrategy,
      resetUnspentDestination,
      resetOtherGoalNote,
      dailyJarDestination,
    };

    const flex = resolveFlexibleMonthly(draft);
    if (!Number.isFinite(flex)) {
      setValidationError(t('onboarding.budget.budgetSplit.validation'));
      return;
    }

    await completeSection({
      persist: async () => { await persistFinalBudgetOnboarding(draft); },
      onboardingPatch: {
        completed: false,
        currentStep: 'review',
        percentComplete: 96,
        resumeRoute: '/(onboarding)/splash-review',
      },
      nextRoute: '/(onboarding)/splash-review',
      routeName: 'budget-spending-strategy',
    });
  };

  const handleBack = () => {
    setValidationError('');
    navigateForward('/(onboarding)/budget-rollover');
  };

  return (
    <QuestionScreen
      illustration={<FinanceAppPanaIllustration width={layout.illustrationWidth} />}
      chapter={t('onboarding.budget.chapter')}
      title={t('onboarding.budget.spendingStrategy.title')}
      helper={t('onboarding.budget.spendingStrategy.helper')}
      onContinue={handleContinue}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      validationError={validationError}
        setValidationError={setValidationError}
      animationKey="spending-strategy"
      resumeRoute="/(onboarding)/budget-spending-strategy"
      exitPatch={{ currentStep: 'budget', percentComplete: 96 }}
    >
      <View>
        {DAILY_SPENDING_STRATEGIES.map(({ id }) => (
          <OptionCard
            key={id}
            label={t(`onboarding.budget.spendingStrategy.${id}`)}
            subtitle={t(`onboarding.budget.spendingStrategy.${id}Desc`)}
            selected={dailyJarDestination === id}
            onPress={() => { setDailyJarDestination(id); setValidationError(''); }}
          />
        ))}
      </View>
    </QuestionScreen>
  );
}
