import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import OptionCard from '../../components/onboarding/OptionCard';
import SplitDateFields from '../../components/onboarding/SplitDateFields';
import LabeledInput from '../../components/onboarding/LabeledInput';
import InputGroup from '../../components/onboarding/InputGroup';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import { useOnboardingMultiStep } from '../../lib/useOnboardingMultiStep';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import PersonalGoalsIllustration from '../../components/onboarding/PersonalGoalsIllustration';
import SavingsCuateIllustration from '../../components/onboarding/SavingsCuateIllustration';
import {
  GOAL_INTENTS,
  SAVE_MODES,
  DEFAULT_GOAL_INTENTS,
  buildIncomeGoalPayload,
  goalIntentsIncludeSaving,
  hasAnyGoalIntent,
  restoreGoalSelection,
  toggleGoalIntent,
} from '../../lib/incomeGoals';

/**
 * Strategy section — financial goal intents and savings targets (goal intents / mode / details steps).
 */
export default function StrategyScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  const { step, setStep } = useOnboardingMultiStep('strategy', {
    defaultStep: 'goalIntents',
    onFocus: async () => {
      const loc = await getData('beaverr_location');
      if (loc?.currency) setCurrencyCode(loc.currency);

      const saved = await getData('beaverr_income');
      if (saved) {
        if (saved.savingsBalance != null) setSavingsBalance(saved.savingsBalance);
        if (saved.savingsMonthlyTarget) setSavingsMonthlyTarget(String(saved.savingsMonthlyTarget));
        const restoredGoal = restoreGoalSelection(saved);
        setGoalIntents(restoredGoal.goalIntents);
        if (restoredGoal.saveMode) setSaveMode(restoredGoal.saveMode);
        if (saved.goalDescription) setGoalDescription(saved.goalDescription);
        if (saved.goalAmount) setGoalAmount(String(saved.goalAmount));
        if (saved.goalDate) setGoalDate(saved.goalDate);
      }
    },
  });

  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);
  const [savingsBalance, setSavingsBalance] = useState(null);

  const [goalIntents, setGoalIntents] = useState({ ...DEFAULT_GOAL_INTENTS });
  const [saveMode, setSaveMode] = useState(null);
  const [goalDescription, setGoalDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [savingsMonthlyTarget, setSavingsMonthlyTarget] = useState('');

  const [validationError, setValidationError] = useState('');
  const [goalFieldErrors, setGoalFieldErrors] = useState({ name: '', amount: '', date: '', ongoing: '' });

  const clearGoalFieldErrors = () => setGoalFieldErrors({ name: '', amount: '', date: '', ongoing: '' });

  const validateGoalDetails = () => {
    if (saveMode === SAVE_MODES.TARGET) {
      if (!goalDescription.trim()) {
        setGoalFieldErrors((prev) => ({
          ...prev,
          name: t('onboarding.strategy.goalDetails.validationGoalName'),
        }));
        return false;
      }
      if (!goalAmount) {
        setGoalFieldErrors((prev) => ({
          ...prev,
          amount: t('onboarding.strategy.goalDetails.validationTargetAmount'),
        }));
        return false;
      }
      if (!goalDate) {
        setGoalFieldErrors((prev) => ({
          ...prev,
          date: t('onboarding.strategy.goalDetails.validationTargetDate'),
        }));
        return false;
      }
      return true;
    }

    if (!savingsMonthlyTarget) {
      setGoalFieldErrors((prev) => ({
        ...prev,
        ongoing: t('onboarding.strategy.goalDetails.validationOngoingAmount'),
      }));
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    setValidationError('');
    clearGoalFieldErrors();

    if (isEditMode) {
      if (step === 'goalDetails' && !validateGoalDetails()) return;
      await saveAll();
      return;
    }

    if (step === 'goalIntents') {
      if (!hasAnyGoalIntent(goalIntents)) {
        setValidationError(t('onboarding.strategy.goalIntents.validationType'));
        return;
      }
      if (!goalIntentsIncludeSaving(goalIntents)) {
        await saveAll();
        return;
      }
      setStep('goalMode');
    } else if (step === 'goalMode') {
      if (!saveMode) {
        setValidationError(t('onboarding.strategy.goalMode.validation'));
        return;
      }
      setStep('goalDetails');
    } else if (step === 'goalDetails') {
      if (!validateGoalDetails()) return;
      await saveAll();
    }
  };

  const saveAll = async () => {
    const existing = (await getData('beaverr_income')) || {};
    const incomeData = {
      ...existing,
      ...buildIncomeGoalPayload({
        goalIntents,
        saveMode,
        savingsBalance,
        savingsMonthlyTarget,
        goalDescription: goalDescription.trim(),
        goalAmount,
        goalDate,
      }),
    };

    await completeSection({
      persist: async () => { await setData('beaverr_income', incomeData); },
      onboardingPatch: { completed: false, currentStep: 'strategy', percentComplete: 58 },
      nextRoute: '/(onboarding)/splash-housing',
      routeName: 'strategy',
    });
  };

  const handleBack = () => {
    setValidationError('');
    clearGoalFieldErrors();
    if (step === 'goalDetails') { setStep('goalMode'); return; }
    if (step === 'goalMode') { setStep('goalIntents'); return; }
    if (step === 'goalIntents') {
      leaveSection(() => navigateBack());
    }
  };

  if (step === 'goalIntents') {
    return (
      <QuestionScreen
        progressStep={step}
        animationKey={step}
        chapter={t('onboarding.strategy.chapter')}
        title={t('onboarding.strategy.goalIntents.title')}
        helper={t('onboarding.strategy.goalIntents.helper')}
        illustration={<PersonalGoalsIllustration width={layout.illustrationWidth} />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        <OptionCard
          label={t('onboarding.strategy.goalIntents.intentClarity')}
          subtitle={t('onboarding.strategy.goalIntents.intentClarityDesc')}
          selected={goalIntents.clarity}
          onPress={() => setGoalIntents((prev) => toggleGoalIntent(prev, GOAL_INTENTS.CLARITY))}
        />
        <OptionCard
          label={t('onboarding.strategy.goalIntents.intentSpendLess')}
          subtitle={t('onboarding.strategy.goalIntents.intentSpendLessDesc')}
          selected={goalIntents.spendLess}
          onPress={() => setGoalIntents((prev) => toggleGoalIntent(prev, GOAL_INTENTS.SPEND_LESS))}
        />
        <OptionCard
          label={t('onboarding.strategy.goalIntents.intentBuildMore')}
          subtitle={t('onboarding.strategy.goalIntents.intentBuildMoreDesc')}
          selected={goalIntents.buildMore}
          onPress={() => setGoalIntents((prev) => toggleGoalIntent(prev, GOAL_INTENTS.BUILD_MORE))}
        />
      </QuestionScreen>
    );
  }

  if (step === 'goalMode') {
    return (
      <QuestionScreen
        progressStep={step}
        animationKey={step}
        chapter={t('onboarding.strategy.chapter')}
        title={t('onboarding.strategy.goalMode.title')}
        helper={t('onboarding.strategy.goalMode.helper')}
        illustration={<SavingsCuateIllustration width={layout.illustrationWidth} />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        <OptionCard
          label={t('onboarding.strategy.goalMode.target')}
          subtitle={t('onboarding.strategy.goalMode.targetDesc')}
          selected={saveMode === SAVE_MODES.TARGET}
          onPress={() => setSaveMode(SAVE_MODES.TARGET)}
        />
        <OptionCard
          label={t('onboarding.strategy.goalMode.ongoing')}
          subtitle={t('onboarding.strategy.goalMode.ongoingDesc')}
          selected={saveMode === SAVE_MODES.ONGOING}
          onPress={() => setSaveMode(SAVE_MODES.ONGOING)}
        />
      </QuestionScreen>
    );
  }

  if (step === 'goalDetails') {
    const isTarget = saveMode === SAVE_MODES.TARGET;
    return (
      <QuestionScreen
        progressStep={step}
        animationKey={step}
        chapter={t('onboarding.strategy.chapter')}
        title={isTarget
          ? t('onboarding.strategy.goalDetails.targetTitle')
          : t('onboarding.strategy.goalDetails.ongoingTitle')}
        helper={isTarget
          ? t('onboarding.strategy.goalDetails.targetHelper')
          : t('onboarding.strategy.goalDetails.ongoingHelper')}
        illustration={<SavingsCuateIllustration width={layout.illustrationWidth} />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}

        continueLabel={editContinueLabel}
      >
        {isTarget ? (
          <>
            <InputGroup
              label={t('onboarding.strategy.goalDetails.nameLabel')}
              errorText={goalFieldErrors.name || undefined}
            >
              <LabeledInput
                value={goalDescription}
                onChangeText={(v) => {
                  setGoalDescription(v);
                  if (goalFieldErrors.name) {
                    setGoalFieldErrors((prev) => ({ ...prev, name: '' }));
                  }
                }}
                errorText={goalFieldErrors.name || undefined}
                placeholder={t('onboarding.strategy.goalDetails.namePlaceholder')}
                inGroup
              />
            </InputGroup>

            <InputGroup
              label={t('onboarding.strategy.goalDetails.amountLabel')}
              errorText={goalFieldErrors.amount || undefined}
            >
              <LabeledInput
                value={goalAmount}
                onChangeText={(v) => {
                  setGoalAmount(v);
                  if (goalFieldErrors.amount) {
                    setGoalFieldErrors((prev) => ({ ...prev, amount: '' }));
                  }
                }}
                errorText={goalFieldErrors.amount || undefined}
                numeric
                placeholder={t('onboarding.strategy.goalDetails.amountPlaceholder')}
                large
                inGroup
                currency={currency}
              />
            </InputGroup>

            <InputGroup
              label={t('onboarding.strategy.goalDetails.dateLabel')}
              errorText={goalFieldErrors.date || undefined}
            >
              <SplitDateFields
                value={goalDate}
                onChange={(v) => {
                  setGoalDate(v);
                  if (goalFieldErrors.date) {
                    setGoalFieldErrors((prev) => ({ ...prev, date: '' }));
                  }
                }}
                errorText={goalFieldErrors.date || undefined}
                inGroup
                yearEnd={new Date().getFullYear() + 30}
              />
            </InputGroup>
          </>
        ) : (
          <InputGroup
            label={t('onboarding.strategy.goalDetails.monthlyTargetLabel')}
            errorText={goalFieldErrors.ongoing || undefined}
          >
            <LabeledInput
              value={savingsMonthlyTarget}
              onChangeText={(v) => {
                setSavingsMonthlyTarget(v);
                if (goalFieldErrors.ongoing) {
                  setGoalFieldErrors((prev) => ({ ...prev, ongoing: '' }));
                }
              }}
              errorText={goalFieldErrors.ongoing || undefined}
              numeric
              placeholder={t('onboarding.strategy.goalDetails.monthlyTargetPlaceholder')}
              large
              inGroup
              currency={currency}
            />
          </InputGroup>
        )}
      </QuestionScreen>
    );
  }

  return null;
}
