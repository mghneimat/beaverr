import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { setData } from '../../lib/storage';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import {
  QUICK_RESUME_ROUTE,
  QUICK_SETUP_PERCENT,
  patchOnboardingState,
} from '../../lib/onboardingProgress';
import { snapshotQuickSetupData } from '../../lib/onboardingExit';
import { DEFAULT_GOAL_INTENTS, buildIncomeGoalPayload } from '../../lib/incomeGoals';
import { C, T } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import OptionCard from '../../components/onboarding/OptionCard';
import LabeledInput from '../../components/onboarding/LabeledInput';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import QuantityStepper from '../../components/onboarding/QuantityStepper';
import SkipButton from '../../components/onboarding/SkipButton';

const OCCUPATIONS = [
  { key: 'employee', icon: '💼' },
  { key: 'selfEmployed', icon: '🧾' },
  { key: 'student', icon: '🎓' },
  { key: 'notWorking', icon: '🏠' },
  { key: 'other', icon: '❓' },
];

const STEP_PROGRESS = {
  name: 4,
  household: 8,
  children: 12,
  employment: 16,
  income: 18,
  rent: 20,
  utilities: 24,
};

/**
 * Condensed onboarding — name, household, kids, employment, income, rent, utilities → dashboard.
 */
export default function QuickSetupScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const [step, setStep] = useState('name');
  const [validationError, setValidationError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [householdType, setHouseholdType] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [hasChildren, setHasChildren] = useState(false);
  const [numChildren, setNumChildren] = useState(1);

  const [userOccupation, setUserOccupation] = useState('');
  const [partnerOccupation, setPartnerOccupation] = useState('');
  const [employmentSubStep, setEmploymentSubStep] = useState('user');

  const [rentAmount, setRentAmount] = useState('');
  const [utilitiesAmount, setUtilitiesAmount] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [partnerIncomeAmount, setPartnerIncomeAmount] = useState('');
  const [incomeSubStep, setIncomeSubStep] = useState('user');

  const hasPartner = householdType === 'partner';
  const userNotWorking = userOccupation === 'notWorking';
  const partnerNotWorking = partnerOccupation === 'notWorking';
  const needsUserIncome = !userNotWorking;
  const needsPartnerIncome = hasPartner && !partnerNotWorking;

  const handleBack = () => {
    setValidationError('');
    if (step === 'name') {
      router.replace('/(onboarding)/setup-mode');
      return;
    }
    if (step === 'household') { setStep('name'); return; }
    if (step === 'children') { setStep('household'); return; }
    if (step === 'employment') {
      if (employmentSubStep === 'partner') {
        setEmploymentSubStep('user');
        return;
      }
      setStep('children');
      return;
    }
    if (step === 'income') {
      if (incomeSubStep === 'partner') {
        setIncomeSubStep('user');
        return;
      }
      setStep('employment');
      setEmploymentSubStep(hasPartner ? 'partner' : 'user');
      return;
    }
    if (step === 'rent') {
      setStep('income');
      setIncomeSubStep(needsPartnerIncome ? 'partner' : 'user');
      return;
    }
    if (step === 'utilities') { setStep('rent'); return; }
  };

  const finishQuickSetup = async () => {
    const children = hasChildren
      ? Array.from({ length: numChildren }, () => ({ displayName: null, ageGroup: '' }))
      : [];

    await setData('beaverr_household', {
      type: householdType,
      displayName: displayName.trim(),
      partnerName: hasPartner ? partnerName.trim() : null,
      children,
    });

    await setData('beaverr_location', {
      country: 'CZ',
      city: null,
      currency: 'CZK',
    });

    await setData('beaverr_occupation', {
      user: userOccupation,
      partner: hasPartner ? partnerOccupation : null,
    });

    await setData('beaverr_income', {
      amount: incomeAmount ? parseFloat(incomeAmount) : null,
      frequency: 'monthly',
      partnerAmount: partnerIncomeAmount ? parseFloat(partnerIncomeAmount) : null,
      partnerFrequency: 'monthly',
      hasOtherIncome: false,
      otherIncomeRows: [],
      ...buildIncomeGoalPayload({
        goalIntents: DEFAULT_GOAL_INTENTS,
        saveMode: null,
        savingsBalance: '',
        savingsMonthlyTarget: '',
        goalDescription: '',
        goalAmount: '',
        goalDate: '',
      }),
    });

    await setData('beaverr_housing', {
      type: 'renting',
      rent: rentAmount ? parseFloat(rentAmount) : null,
      utilitiesMode: 'total',
      utilities: utilitiesAmount ? parseFloat(utilitiesAmount) : null,
      utilitiesFrequency: 'monthly',
      utilityItems: [],
      utilityBreakdown: null,
      utilityOtherRows: [],
      hasInternet: null,
      internetAmount: null,
      internetFrequency: null,
      hasMortgage: null,
      mortgageAmount: null,
      mortgageEndDate: null,
      hasOtherCosts: false,
      otherCostRows: [],
      contributesToFamily: false,
      familyContributionRows: [],
      govtTaxes: null,
    });

    await snapshotQuickSetupData();

    await patchOnboardingState({
      completed: false,
      dashboardUnlocked: true,
      questionnaireComplete: false,
      setupMode: 'quick',
      currentStep: 'quick-setup-done',
      resumeRoute: QUICK_RESUME_ROUTE,
      percentComplete: QUICK_SETUP_PERCENT,
    });

    notifyDashboardRefresh();
    router.replace('/(app)/dashboard');
  };

  const handleContinue = async () => {
    setValidationError('');

    if (step === 'name') {
      if (!displayName.trim()) {
        setValidationError(t('onboarding.quickSetup.name.validation'));
        return;
      }
      setStep('household');
      return;
    }

    if (step === 'household') {
      if (!householdType) {
        setValidationError(t('onboarding.household.type.validation'));
        return;
      }
      if (hasPartner && !partnerName.trim()) {
        setValidationError(t('onboarding.household.partnerName.validation'));
        return;
      }
      setStep('children');
      return;
    }

    if (step === 'children') {
      setEmploymentSubStep('user');
      setStep('employment');
      return;
    }

    if (step === 'employment') {
      if (employmentSubStep === 'user') {
        if (!userOccupation) {
          setValidationError(t('onboarding.occupation.validation'));
          return;
        }
        if (hasPartner) {
          setEmploymentSubStep('partner');
          return;
        }
        setIncomeSubStep('user');
        setStep('income');
        return;
      }
      if (!partnerOccupation) {
        setValidationError(t('onboarding.occupation.validation'));
        return;
      }
      setIncomeSubStep('user');
      setStep('income');
      return;
    }

    if (step === 'income') {
      if (incomeSubStep === 'user') {
        if (needsUserIncome && (!incomeAmount.trim() || Number.isNaN(parseFloat(incomeAmount)))) {
          setValidationError(t('onboarding.quickSetup.income.validation'));
          return;
        }
        if (needsPartnerIncome) {
          setIncomeSubStep('partner');
          return;
        }
        setStep('rent');
        return;
      }
      if (needsPartnerIncome && (!partnerIncomeAmount.trim() || Number.isNaN(parseFloat(partnerIncomeAmount)))) {
        setValidationError(t('onboarding.quickSetup.income.partnerValidation', {
          name: partnerName || t('onboarding.quickSetup.partnerFallback'),
        }));
        return;
      }
      setStep('rent');
      return;
    }

    if (step === 'rent') {
      if (!rentAmount.trim() || Number.isNaN(parseFloat(rentAmount))) {
        setValidationError(t('onboarding.housing.rentDetails.validation'));
        return;
      }
      setStep('utilities');
      return;
    }

    if (step === 'utilities') {
      if (!utilitiesAmount.trim() || Number.isNaN(parseFloat(utilitiesAmount))) {
        setValidationError(t('onboarding.quickSetup.utilities.validation'));
        return;
      }
      await finishQuickSetup();
    }
  };

  const progress = STEP_PROGRESS[step] ?? 4;
  const chapter = t('onboarding.quickSetup.chapter');

  if (step === 'name') {
    return (
      <QuestionScreen
        animationKey="name"
        chapter={chapter}
        title={t('onboarding.quickSetup.name.title')}
        helper={t('onboarding.quickSetup.name.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}
      >
        <LabeledInput
          label={t('onboarding.quickSetup.name.label')}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('onboarding.quickSetup.name.placeholder')}
          autoFocus
        />
      </QuestionScreen>
    );
  }

  if (step === 'household') {
    return (
      <QuestionScreen
        animationKey="household"
        chapter={chapter}
        title={t('onboarding.household.type.title')}
        helper={t('onboarding.household.type.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}
      >
        <OptionCard
          icon="🧍"
          label={t('onboarding.household.type.solo')}
          selected={householdType === 'solo'}
          onPress={() => setHouseholdType('solo')}
        />
        <OptionCard
          icon="👫"
          label={t('onboarding.household.type.partner')}
          selected={householdType === 'partner'}
          onPress={() => setHouseholdType('partner')}
        />
        <OptionCard
          icon="👨‍👧"
          label={t('onboarding.household.type.singleParent')}
          selected={householdType === 'singleParent'}
          onPress={() => setHouseholdType('singleParent')}
        />
        {hasPartner ? (
          <LabeledInput
            label={t('onboarding.household.partnerName.label')}
            value={partnerName}
            onChangeText={setPartnerName}
            placeholder={t('onboarding.household.partnerName.placeholder')}
            containerStyle={{ marginTop: 16 }}
          />
        ) : null}
      </QuestionScreen>
    );
  }

  if (step === 'children') {
    return (
      <QuestionScreen
        animationKey="children"
        chapter={chapter}
        title={t('onboarding.household.children.title')}
        helper={t('onboarding.household.children.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}
      >
        <YesNoToggle value={hasChildren} onChange={setHasChildren} containerStyle={{ marginBottom: 20 }} />
        {hasChildren ? (
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <QuantityStepper
              value={numChildren}
              min={1}
              max={10}
              onDecrement={() => setNumChildren(numChildren - 1)}
              onIncrement={() => setNumChildren(numChildren + 1)}
            />
          </View>
        ) : null}
      </QuestionScreen>
    );
  }

  if (step === 'employment') {
    const isPartnerStep = employmentSubStep === 'partner';
    const selected = isPartnerStep ? partnerOccupation : userOccupation;
    const setSelected = isPartnerStep ? setPartnerOccupation : setUserOccupation;

    return (
      <QuestionScreen
        animationKey={employmentSubStep}
        chapter={chapter}
        title={isPartnerStep
          ? t('onboarding.occupation.partnerTitle', { name: partnerName || t('onboarding.quickSetup.partnerFallback') })
          : t('onboarding.occupation.title')}
        helper={isPartnerStep ? t('onboarding.occupation.partnerHelper') : t('onboarding.occupation.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}
      >
        {OCCUPATIONS.map(({ key, icon }) => (
          <OptionCard
            key={key}
            icon={icon}
            label={t(`onboarding.occupation.${key}`)}
            selected={selected === key}
            onPress={() => setSelected(key)}
          />
        ))}
      </QuestionScreen>
    );
  }

  if (step === 'income') {
    const isPartnerIncome = incomeSubStep === 'partner';
    const showSkip = !isPartnerIncome && userNotWorking;

    return (
      <QuestionScreen
        animationKey={isPartnerIncome ? 'income-partner' : 'income-user'}
        chapter={chapter}
        title={isPartnerIncome
          ? t('onboarding.quickSetup.income.partnerTitle', {
            name: partnerName || t('onboarding.quickSetup.partnerFallback'),
          })
          : (userNotWorking
            ? t('onboarding.quickSetup.income.titleNotWorking')
            : t('onboarding.quickSetup.income.title'))}
        helper={isPartnerIncome
          ? t('onboarding.quickSetup.income.partnerHelper')
          : (userNotWorking
            ? t('onboarding.quickSetup.income.helperNotWorking')
            : t('onboarding.quickSetup.income.helper'))}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}
      >
        {isPartnerIncome ? (
          <LabeledInput
            label={t('onboarding.quickSetup.income.amountLabel')}
            value={partnerIncomeAmount}
            onChangeText={setPartnerIncomeAmount}
            keyboardType="numeric"
            placeholder="0"
          />
        ) : (
          <>
            {userNotWorking ? (
              <View style={{
                padding: 16,
                backgroundColor: C.infoBg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.infoBorder,
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 14, color: C.infoText, lineHeight: 22 }}>
                  {t('onboarding.income.yourIncome.notWorkingNote')}
                </Text>
              </View>
            ) : null}
            <LabeledInput
              label={t('onboarding.quickSetup.income.amountLabel')}
              value={incomeAmount}
              onChangeText={setIncomeAmount}
              keyboardType="numeric"
              placeholder="0"
            />
            {showSkip ? (
              <SkipButton
                label={t('onboarding.quickSetup.income.skipNoIncome')}
                onPress={() => {
                  setValidationError('');
                  setIncomeAmount('');
                  if (needsPartnerIncome) {
                    setIncomeSubStep('partner');
                    return;
                  }
                  setStep('rent');
                }}
              />
            ) : null}
          </>
        )}
      </QuestionScreen>
    );
  }

  if (step === 'rent') {
    return (
      <QuestionScreen
        animationKey="rent"
        chapter={chapter}
        title={t('onboarding.housing.rentDetails.title')}
        helper={t('onboarding.quickSetup.rent.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}
      >
        <LabeledInput
          label={t('onboarding.housing.rentDetails.amountLabel')}
          value={rentAmount}
          onChangeText={setRentAmount}
          keyboardType="numeric"
          placeholder="0"
        />
      </QuestionScreen>
    );
  }

  if (step === 'utilities') {
    return (
      <QuestionScreen
        animationKey="utilities"
        chapter={chapter}
        title={t('onboarding.housing.rentUtilities.title')}
        helper={t('onboarding.quickSetup.utilities.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        setValidationError={setValidationError}
        continueLabel={t('onboarding.quickSetup.finishCta')}
      >
        <LabeledInput
          label={t('onboarding.housing.rentUtilities.amountLabel')}
          value={utilitiesAmount}
          onChangeText={setUtilitiesAmount}
          keyboardType="numeric"
          placeholder="0"
        />
      </QuestionScreen>
    );
  }

  return null;
}
