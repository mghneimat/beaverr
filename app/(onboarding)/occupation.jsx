import { useState, useRef } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward, recordVisit } from '../../lib/onboardingNavigation';
import { getData, setData } from '../../lib/storage';
import { patchOnboardingState } from '../../lib/onboardingProgress';
import {
  buildOccupationResumeRoute,
  computeOccupationReturnPoint,
  hasOccupationPartner,
  occupationNavParams,
  resolveOccupationReturnPoint,
} from '../../lib/occupationOnboardingSave';
import { useOnboardingMultiStep } from '../../lib/useOnboardingMultiStep';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import OptionCard from '../../components/onboarding/OptionCard';
import LabeledInput from '../../components/onboarding/LabeledInput';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';

const OCCUPATIONS = [
  { key: 'employee' },
  { key: 'selfEmployed' },
  { key: 'student' },
  { key: 'notWorking' },
  { key: 'other' },
];

/**
 * Animated "Other" text input that slides and fades in/out.
 * @param {Object} props
 * @param {boolean} props.visible - Whether the input should be shown
 * @param {string} props.value - Current input value
 * @param {(text: string) => void} props.onChangeText - Text change handler
 * @param {string} props.placeholder - Placeholder text
 */
function AnimatedOtherInput({ visible, value, onChangeText, placeholder, label }) {
  return (
    <AnimatedSlideIn visible={visible} duration={250}>
      <LabeledInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        maxLength={100}
        containerStyle={{ marginTop: 4 }}
      />
    </AnimatedSlideIn>
  );
}

export default function OccupationScreen() {
  const { t } = useI18n();
  const householdRef = useRef(null);

  const [userOccupation, setUserOccupation] = useState('');
  const [userOtherText, setUserOtherText] = useState('');
  const [partnerOccupation, setPartnerOccupation] = useState('');
  const [partnerOtherText, setPartnerOtherText] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [hasPartner, setHasPartner] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { step, setStep } = useOnboardingMultiStep('occupation', {
    defaultStep: 'user',
    onFocus: async () => {
      const [household, occupation] = await Promise.all([
        getData('beaverr_household'),
        getData('beaverr_occupation'),
      ]);

      householdRef.current = household;
      const partnerHousehold = hasOccupationPartner(household);
      setHasPartner(partnerHousehold);
      if (partnerHousehold) {
        setPartnerName(household.partnerName);
      }

      if (occupation) {
        setUserOccupation(occupation.user || '');
        setUserOtherText(occupation.userOtherText || '');
        if (occupation.partner) {
          setPartnerOccupation(occupation.partner);
          setPartnerOtherText(occupation.partnerOtherText || '');
        }
      }
    },
    loadStepFromStorage: (occupation) => {
      const returnPoint = resolveOccupationReturnPoint(occupation, householdRef.current);
      return { step: returnPoint.step };
    },
  });

  const handleContinue = async () => {
    setValidationError('');

    if (step === 'user') {
      if (!userOccupation) {
        setValidationError(t('onboarding.occupation.validation'));
        return;
      }
      if (hasPartner) {
        setStep('partner');
      } else {
        await saveAndContinue();
      }
    } else if (step === 'partner') {
      if (!partnerOccupation) {
        setValidationError(t('onboarding.occupation.validation'));
        return;
      }
      await saveAndContinue();
    }
  };

  const saveAndContinue = async () => {
    const occupationData = {
      user: userOccupation,
      userOtherText: userOccupation === 'other' ? userOtherText.trim() || null : null,
      partner: hasPartner ? partnerOccupation : null,
      partnerOtherText: partnerOccupation === 'other' ? partnerOtherText.trim() || null : null,
    };

    const returnPoint = computeOccupationReturnPoint({ hasPartner });

    await setData('beaverr_occupation', {
      ...occupationData,
      occupationOnboardingStep: returnPoint.step,
    });

    await patchOnboardingState({
      completed: false,
      setupMode: 'full',
      currentStep: 'occupation',
      percentComplete: 40,
      resumeRoute: '/(onboarding)/splash-income',
    });

    recordVisit('/(onboarding)/occupation', occupationNavParams(returnPoint.step));
    navigateForward('/(onboarding)/splash-income');
  };

  const resumeRoute = buildOccupationResumeRoute(step);

  const sharedScreenProps = {
    chapter: t('onboarding.location.chapter'),
    onContinue: handleContinue,
    onBack: handleBack,
    validationError,
    setValidationError,
    progressStep: step,
    resumeRoute,
  };

  const handleBack = async () => {
    if (step === 'partner') {
      setStep('user');
      setValidationError('');
    } else {
      const location = await getData('beaverr_location');
      const household = await getData('beaverr_household');
      navigateBack();
    }
  };

  // Q4: User occupation
  if (step === 'user') {
    return (
      <QuestionScreen
        {...sharedScreenProps}
        animationKey={step}
        title={t('onboarding.occupation.title')}
        helper={t('onboarding.occupation.helper')}
      >
        {OCCUPATIONS.map((occ) => (
          <OptionCard
            key={occ.key}
            label={t(`onboarding.occupation.${occ.key}`)}
            selected={userOccupation === occ.key}
            onPress={() => {
              setUserOccupation(occ.key);
              setValidationError('');
            }}
          />
        ))}

        {/* "Other" text input — animated slide/fade */}
        <AnimatedOtherInput
          visible={userOccupation === 'other'}
          value={userOtherText}
          onChangeText={setUserOtherText}
          label={t('onboarding.occupation.otherLabel')}
          placeholder={t('onboarding.occupation.otherPlaceholder')}
        />
      </QuestionScreen>
    );
  }

  // Q4a: Partner occupation
  if (step === 'partner') {
    return (
      <QuestionScreen
        {...sharedScreenProps}
        animationKey={step}
        title={t('onboarding.occupation.partnerTitle', { name: partnerName })}
        helper={t('onboarding.occupation.partnerHelper')}
      >
        {OCCUPATIONS.map((occ) => (
          <OptionCard
            key={occ.key}
            label={t(`onboarding.occupation.${occ.key}`)}
            selected={partnerOccupation === occ.key}
            onPress={() => {
              setPartnerOccupation(occ.key);
              setValidationError('');
            }}
          />
        ))}

        {/* "Other" text input — animated slide/fade */}
        <AnimatedOtherInput
          visible={partnerOccupation === 'other'}
          value={partnerOtherText}
          onChangeText={setPartnerOtherText}
          label={t('onboarding.occupation.otherLabel')}
          placeholder={t('onboarding.occupation.otherPlaceholder')}
        />
      </QuestionScreen>
    );
  }

  return null;
}
