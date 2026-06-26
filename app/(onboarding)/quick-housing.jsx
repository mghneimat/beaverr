import { useState } from 'react';
import { View } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { patchOnboardingState } from '../../lib/onboardingProgress';
import { navigateBack } from '../../lib/onboardingNavigation';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import LabeledInput from '../../components/onboarding/LabeledInput';

import { finishQuickSetup } from '../../lib/onboardingQuickPath';

/**
 * Quick setup tail — monthly rent and utilities, then dashboard.
 */
export default function QuickHousingScreen() {
  const { t } = useI18n();
  const [step, setStep] = useState('rent');
  const [validationError, setValidationError] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [utilitiesAmount, setUtilitiesAmount] = useState('');

  const handleBack = () => {
    setValidationError('');
    if (step === 'rent') {
      navigateBack();
      return;
    }
    setStep('rent');
  };

  const handleContinue = async () => {
    setValidationError('');

    if (step === 'rent') {
      if (!rentAmount.trim() || Number.isNaN(parseFloat(rentAmount))) {
        setValidationError(t('onboarding.housing.rentDetails.validation'));
        return;
      }
      setStep('utilities');
      return;
    }

    if (!utilitiesAmount.trim() || Number.isNaN(parseFloat(utilitiesAmount))) {
      setValidationError(t('onboarding.quickSetup.utilities.validation'));
      return;
    }

    await patchOnboardingState({
      setupMode: 'quick',
      currentStep: 'quick-housing',
      resumeRoute: '/(onboarding)/quick-housing',
    });

    await finishQuickSetup({ rentAmount, utilitiesAmount });
  };

  if (step === 'rent') {
    return (
      <QuestionScreen
        animationKey="quick-rent"
        chapter={t('onboarding.quickSetup.chapter')}
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

  return (
    <QuestionScreen
      animationKey="quick-utilities"
      chapter={t('onboarding.quickSetup.chapter')}
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
