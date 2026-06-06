import { useState, useEffect, useRef } from 'react';
import { View, TextInput } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PlaceholderIllustration from '../../components/onboarding/PlaceholderIllustration';
import OptionCard from '../../components/onboarding/OptionCard';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';

const OCCUPATIONS = [
  { key: 'employee', icon: '💼' },
  { key: 'selfEmployed', icon: '🧾' },
  { key: 'student', icon: '🎓' },
  { key: 'notWorking', icon: '🏠' },
  { key: 'other', icon: '❓' },
];

/**
 * Animated "Other" text input that slides and fades in/out.
 * @param {Object} props
 * @param {boolean} props.visible - Whether the input should be shown
 * @param {string} props.value - Current input value
 * @param {(text: string) => void} props.onChangeText - Text change handler
 * @param {string} props.placeholder - Placeholder text
 */
function AnimatedOtherInput({ visible, value, onChangeText, placeholder }) {
  return (
    <AnimatedSlideIn visible={visible} duration={250}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C4C2BC"
        style={{
          backgroundColor: '#FDFCFA',
          borderWidth: 1.5,
          borderColor: '#E4E2DC',
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 14,
          color: '#1A1A1A',
          fontSize: 17,
          fontWeight: '300',
          marginTop: 4,
        }}
        maxLength={100}
      />
    </AnimatedSlideIn>
  );
}

export default function OccupationScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const [userOccupation, setUserOccupation] = useState('');
  const [userOtherText, setUserOtherText] = useState('');
  const [partnerOccupation, setPartnerOccupation] = useState('');
  const [partnerOtherText, setPartnerOtherText] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [hasPartner, setHasPartner] = useState(false);
  const [step, setStep] = useState('user'); // 'user' | 'partner'
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    async function loadData() {
      const household = await getData('pocketos_household');
      if (household?.type === 'partner' && household?.partnerName) {
        setHasPartner(true);
        setPartnerName(household.partnerName);
      }

      const occupation = await getData('pocketos_occupation');
      if (occupation) {
        setUserOccupation(occupation.user || '');
        setUserOtherText(occupation.userOtherText || '');
        if (occupation.partner) {
          setPartnerOccupation(occupation.partner);
          setPartnerOtherText(occupation.partnerOtherText || '');
        }
      }
    }
    loadData();
  }, []);

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

    await setData('pocketos_occupation', occupationData);

    await setData('pocketos_onboarding', {
      completed: false,
      currentStep: 'occupation',
      percentComplete: 40,
    });

    router.replace('/(onboarding)/splash-income');
  };

  const handleBack = () => {
    if (step === 'partner') {
      setStep('user');
      setValidationError('');
    } else {
      // On the first question — navigate back to the occupation splash screen
      router.replace('/(onboarding)/splash-location');
    }
  };

  // Q4: User occupation
  if (step === 'user') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.location.chapter')}
        title={t('onboarding.occupation.title')}
        helper={t('onboarding.occupation.helper')}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={30}
        progressLabel={t('onboarding.progress', { percent: '30' })}
      >
        {OCCUPATIONS.map((occ) => (
          <OptionCard
            key={occ.key}
            icon={occ.icon}
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
          placeholder={t('onboarding.occupation.otherPlaceholder')}
        />
      </QuestionScreen>
    );
  }

  // Q4a: Partner occupation
  if (step === 'partner') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.location.chapter')}
        title={t('onboarding.occupation.partnerTitle', { name: partnerName })}
        helper={t('onboarding.occupation.partnerHelper')}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={40}
        progressLabel={t('onboarding.progress', { percent: '40' })}
      >
        {OCCUPATIONS.map((occ) => (
          <OptionCard
            key={occ.key}
            icon={occ.icon}
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
          placeholder={t('onboarding.occupation.otherPlaceholder')}
        />
      </QuestionScreen>
    );
  }

  return null;
}
