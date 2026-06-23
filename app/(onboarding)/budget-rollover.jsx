import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { getData } from '../../lib/storage';
import { aggregateHouseholdCosts } from '../../lib/householdBudget';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import OptionCard from '../../components/onboarding/OptionCard';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import FinanceAppPanaIllustration from '../../components/onboarding/FinanceAppPanaIllustration';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import { persistRolloverDraft, resolveFlexibleMonthly } from '../../lib/budgetOnboardingSave';
import { normalizeResetDestination } from '../../lib/monthEndRouting';
import { migrateBudgetPolicy } from '../../lib/budgetMigration';
import { amountToString } from '../../lib/sectionEditStorage';
import { C, T } from '../../constants/onboarding-theme';

export default function BudgetRolloverScreen() {
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

  useEffect(() => {
    (async () => {
      const inc = await getData('beaverr_income');
      const d = await getData('beaverr_debts') || [];
      const rawBudget = await getData('beaverr_budget');
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

      if (
        savedBudget?.budgetOnboardingStep !== 'flexible-budget'
        && savedBudget?.monthlyFlexible == null
      ) {
        navigateForward('/(onboarding)/budget-setup');
      }
    })();
  }, [router, t]);

  const handleSaveDraft = async () => {
    await persistRolloverDraft({
      rolloverStrategy: rolloverStrategy || 'free',
      resetUnspentDestination,
      resetOtherGoalNote,
    });
  };

  const handleContinue = async () => {
    setValidationError('');

    if (!rolloverStrategy) {
      setValidationError(t('onboarding.budget.rollover.validation'));
      return;
    }
    if (rolloverStrategy === 'reset' && resetUnspentDestination === 'otherGoal' && !resetOtherGoalNote.trim()) {
      setValidationError(t('onboarding.budget.rollover.validationOtherGoal'));
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
    };

    const flex = resolveFlexibleMonthly(draft);
    if (!Number.isFinite(flex)) {
      setValidationError(t('onboarding.budget.budgetSplit.validation'));
      return;
    }

    await completeSection({
      persist: async () => { await persistRolloverDraft(draft); },
      onboardingPatch: {
        completed: false,
        currentStep: 'budget',
        percentComplete: 95,
        resumeRoute: '/(onboarding)/budget-spending-strategy',
      },
      nextRoute: '/(onboarding)/budget-spending-strategy',
      routeName: 'budget-rollover',
    });
  };

  const handleBack = () => {
    setValidationError('');
    navigateForward('/(onboarding)/budget-setup');
  };

  return (
    <QuestionScreen
      illustration={<FinanceAppPanaIllustration width={layout.illustrationWidth} />}
      chapter={t('onboarding.budget.chapter')}
      title={t('onboarding.budget.rollover.title')}
      helper={t('onboarding.budget.rollover.helperMonthly')}
      onContinue={handleContinue}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      validationError={validationError}
        setValidationError={setValidationError}
      animationKey={rolloverStrategy ? `rollover-${rolloverStrategy}` : 'rollover'}
      resumeRoute="/(onboarding)/budget-rollover"
      exitPatch={{ currentStep: 'budget', percentComplete: 96 }}
    >
      <View>
        <OptionCard
          icon="♾️"
          label={t('onboarding.budget.rollover.free')}
          subtitle={t('onboarding.budget.rollover.freeDesc')}
          selected={rolloverStrategy === 'free'}
          onPress={() => { setRolloverStrategy('free'); setValidationError(''); }}
        />
        <OptionCard
          icon="🔁"
          label={t('onboarding.budget.rollover.reset')}
          subtitle={t('onboarding.budget.rollover.resetDesc')}
          selected={rolloverStrategy === 'reset'}
          onPress={() => { setRolloverStrategy('reset'); setValidationError(''); }}
        />

        <AnimatedSlideIn visible={rolloverStrategy === 'reset'}>
          <Text style={{ ...T.fieldLabel, color: C.muted, marginTop: 8, marginBottom: 8 }}>
            {t('onboarding.budget.rollover.resetDestinationLabel')}
          </Text>
          <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
            {t('onboarding.budget.rollover.resetDestinationHelper')}
          </Text>
          {[
            { key: 'looseMoney', label: 'resetPiggyBank', helper: 'resetPiggyBankHelper' },
            { key: 'savings', label: 'resetToSavings', helper: 'resetToSavingsHelper' },
            { key: 'otherGoal', label: 'resetToOtherGoal', helper: 'resetToOtherGoalHelper' },
          ].map((opt) => (
            <OptionCard
              key={opt.key}
              label={t(`onboarding.budget.rollover.${opt.label}`)}
              subtitle={t(`onboarding.budget.rollover.${opt.helper}`)}
              selected={resetUnspentDestination === opt.key}
              onPress={() => {
                setResetUnspentDestination(opt.key);
                setValidationError('');
              }}
            />
          ))}
          <AnimatedSlideIn visible={resetUnspentDestination === 'otherGoal'}>
            <LabeledInput
              label={t('onboarding.budget.rollover.otherGoalLabel')}
              value={resetOtherGoalNote}
              onChangeText={setResetOtherGoalNote}
              placeholder={t('onboarding.budget.rollover.otherGoalPlaceholder')}
              containerStyle={{ marginTop: 4 }}
            />
          </AnimatedSlideIn>
        </AnimatedSlideIn>
      </View>
    </QuestionScreen>
  );
}
