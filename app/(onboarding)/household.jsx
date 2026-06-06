import { useState, useEffect } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { C, R, T, S } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PlaceholderIllustration from '../../components/onboarding/PlaceholderIllustration';
import OptionCard from '../../components/onboarding/OptionCard';
import LabeledInput from '../../components/onboarding/LabeledInput';

// Step → progress % and label mapping
const STEP_PROGRESS = {
  type:         { progress: 10, label: 'Household · 1 of 4' },
  partner:      { progress: 20, label: 'Household · 2 of 4' },
  children:     { progress: 30, label: 'Household · 3 of 4' },
  numChildren:  { progress: 40, label: 'Household · Children' },
  childDetails: { progress: 50, label: 'Household · 4 of 4' },
};

export default function HouseholdScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [householdType, setHouseholdType] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [hasChildren, setHasChildren] = useState(null);
  const [numChildren, setNumChildren] = useState(1);
  const [children, setChildren] = useState([]);
  const [currentStep, setCurrentStep] = useState('type'); // type, partner, children, numChildren, childDetails
  const [currentChildIndex, setCurrentChildIndex] = useState(0);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    async function loadData() {
      const household = await getData('pocketos_household');
      if (household) {
        setHouseholdType(household.type || '');
        setPartnerName(household.partnerName || '');
        if (household.children && household.children.length > 0) {
          setHasChildren(true);
          setNumChildren(household.children.length);
          setChildren(household.children);
        }
      }
    }
    loadData();
  }, []);

  const handleBack = () => {
    setValidationError('');
    if (currentStep === 'type') {
      // On the first question — navigate back to consent
      router.replace('/(onboarding)/consent');
    } else if (currentStep === 'partner') {
      setCurrentStep('type');
    } else if (currentStep === 'children') {
      if (householdType === 'partner') {
        setCurrentStep('partner');
      } else {
        setCurrentStep('type');
      }
    } else if (currentStep === 'numChildren') {
      setCurrentStep('children');
    } else if (currentStep === 'childDetails') {
      if (currentChildIndex > 0) {
        setCurrentChildIndex(currentChildIndex - 1);
      } else {
        setCurrentStep('numChildren');
      }
    }
  };

  const handleContinue = async () => {
    setValidationError('');

    if (currentStep === 'type') {
      if (!householdType) {
        setValidationError(t('onboarding.household.type.validation'));
        return;
      }
      if (householdType === 'partner') {
        setCurrentStep('partner');
      } else {
        setCurrentStep('children');
      }
    } else if (currentStep === 'partner') {
      if (!partnerName.trim()) {
        setValidationError(t('onboarding.household.partnerName.validation'));
        return;
      }
      setCurrentStep('children');
    } else if (currentStep === 'children') {
      if (hasChildren === null) {
        setValidationError(t('onboarding.household.children.validation'));
        return;
      }
      if (hasChildren) {
        setCurrentStep('numChildren');
      } else {
        await saveAndContinue();
      }
    } else if (currentStep === 'numChildren') {
      const newChildren = Array.from({ length: numChildren }, (_, i) => ({
        displayName: children[i]?.displayName || '',
        ageGroup: children[i]?.ageGroup || '',
      }));
      setChildren(newChildren);
      setCurrentChildIndex(0);
      setCurrentStep('childDetails');
    } else if (currentStep === 'childDetails') {
      const currentChild = children[currentChildIndex];
      if (!currentChild.ageGroup) {
        setValidationError(t('onboarding.household.childDetails.validation'));
        return;
      }
      if (currentChildIndex < numChildren - 1) {
        setCurrentChildIndex(currentChildIndex + 1);
      } else {
        await saveAndContinue();
      }
    }
  };

  const saveAndContinue = async () => {
    const householdData = {
      type: householdType,
      partnerName: householdType === 'partner' ? partnerName : null,
      children: hasChildren ? children : [],
    };

    await setData('pocketos_household', householdData);

    await setData('pocketos_onboarding', {
      completed: false,
      currentStep: 'household',
      percentComplete: 20,
    });

    router.replace('/(onboarding)/splash-location');
  };

  const updateChild = (field, value) => {
    const newChildren = [...children];
    newChildren[currentChildIndex] = {
      ...newChildren[currentChildIndex],
      [field]: value,
    };
    setChildren(newChildren);
  };

  const stepMeta = STEP_PROGRESS[currentStep] || { progress: 10, label: '' };

  // Q1: Household Type
  if (currentStep === 'type') {
    return (
      <QuestionScreen
        animationKey={currentStep}
        chapter={t('onboarding.household.chapter')}
        title={t('onboarding.household.type.title')}
        helper={t('onboarding.household.type.helper')}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={stepMeta.progress}
        progressLabel={stepMeta.label}
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
          selected={householdType === 'single_parent'}
          onPress={() => setHouseholdType('single_parent')}
        />
      </QuestionScreen>
    );
  }

  // Q1a: Partner Name
  if (currentStep === 'partner') {
    return (
      <QuestionScreen
        animationKey={currentStep}
        chapter={t('onboarding.household.chapter')}
        title={t('onboarding.household.partnerName.title')}
        helper={t('onboarding.household.partnerName.helper')}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={stepMeta.progress}
        progressLabel={stepMeta.label}
      >
        <LabeledInput
          label={t('onboarding.household.partnerName.label')}
          value={partnerName}
          onChangeText={setPartnerName}
          placeholder={t('onboarding.household.partnerName.placeholder')}
          maxLength={30}
        />
      </QuestionScreen>
    );
  }

  // Q2: Children
  if (currentStep === 'children') {
    return (
      <QuestionScreen
        animationKey={currentStep}
        chapter={t('onboarding.household.chapter')}
        title={t('onboarding.household.children.title')}
        helper={t('onboarding.household.children.helper')}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={stepMeta.progress}
        progressLabel={stepMeta.label}
      >
        <View style={{ gap: 10 }}>
          <OptionCard
            icon="🙅"
            label={t('common.no')}
            selected={hasChildren === false}
            onPress={() => setHasChildren(false)}
          />
          <OptionCard
            icon="👶"
            label={t('common.yes')}
            selected={hasChildren === true}
            onPress={() => setHasChildren(true)}
          />
        </View>
      </QuestionScreen>
    );
  }

  // Q2a: Number of Children
  if (currentStep === 'numChildren') {
    const atMin = numChildren <= 1;
    const atMax = numChildren >= 10;

    return (
      <QuestionScreen
        animationKey={currentStep}
        chapter={t('onboarding.household.chapter')}
        title={t('onboarding.household.numChildren.title')}
        helper={t('onboarding.household.numChildren.helper')}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={stepMeta.progress}
        progressLabel={stepMeta.label}
      >
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          {/* Stepper row */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: C.border,
            borderRadius: R.input,
            overflow: 'hidden',
            backgroundColor: C.surface,
          }}>
            {/* Minus button */}
            <Pressable
              onPress={() => !atMin && setNumChildren(numChildren - 1)}
              disabled={atMin}
              style={({ pressed }) => ({
                width: 52,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed && !atMin ? C.overlayPressed : 'transparent',
                opacity: atMin ? 0.35 : 1,
              })}
            >
              <Text style={{
                fontSize: 24,
                lineHeight: 24,
                color: atMin ? C.addBorder : C.muted,
                fontWeight: '300',
                textAlign: 'center',
                includeFontPadding: false,
              }}>
                {'\u2212'}
              </Text>
            </Pressable>

            {/* Value display */}
            <View style={{
              minWidth: 64,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: C.border,
              paddingHorizontal: 8,
            }}>
              <Text style={{
                fontSize: 28,
                lineHeight: 34,
                fontWeight: '300',
                color: C.text,
                letterSpacing: -0.5,
                textAlign: 'center',
                includeFontPadding: false,
              }}>
                {numChildren}
              </Text>
            </View>

            {/* Plus button */}
            <Pressable
              onPress={() => !atMax && setNumChildren(numChildren + 1)}
              disabled={atMax}
              style={({ pressed }) => ({
                width: 52,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed && !atMax ? C.overlayPressed : 'transparent',
                opacity: atMax ? 0.35 : 1,
              })}
            >
              <Text style={{
                fontSize: 24,
                lineHeight: 24,
                color: atMax ? C.addBorder : C.muted,
                fontWeight: '300',
                textAlign: 'center',
                includeFontPadding: false,
              }}>
                {'+'}
              </Text>
            </Pressable>
          </View>

          {/* Hint */}
          <Text style={{ ...T.hint, color: C.muted, marginTop: 12 }}>
            {numChildren === 1 ? "We'll set up 1 child profile" : `We'll set up ${numChildren} child profiles`}
          </Text>
        </View>
      </QuestionScreen>
    );
  }

  // Q2b: Child Details
  if (currentStep === 'childDetails') {
    const currentChild = children[currentChildIndex];
    return (
      <QuestionScreen
        animationKey={`childDetails-${currentChildIndex}`}
        chapter={t('onboarding.household.chapter')}
        title={t('onboarding.household.childDetails.title', { n: currentChildIndex + 1 })}
        helper={t('onboarding.household.childDetails.helper')}
        illustration={<PlaceholderIllustration />}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={stepMeta.progress}
        progressLabel={stepMeta.label}
      >
        <LabeledInput
          label={t('onboarding.household.childDetails.nameLabel')}
          value={currentChild.displayName}
          onChangeText={(value) => updateChild('displayName', value)}
          placeholder={t('onboarding.household.childDetails.namePlaceholder')}
          maxLength={30}
          containerStyle={{ marginBottom: 20 }}
        />

        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
          {t('onboarding.household.childDetails.ageLabel')}
        </Text>
        <OptionCard
          icon="👶"
          label={t('onboarding.household.childDetails.age0')}
          selected={currentChild.ageGroup === '0-2'}
          onPress={() => updateChild('ageGroup', '0-2')}
        />
        <OptionCard
          icon="🧒"
          label={t('onboarding.household.childDetails.age3')}
          selected={currentChild.ageGroup === '3-5'}
          onPress={() => updateChild('ageGroup', '3-5')}
        />
        <OptionCard
          icon="🎒"
          label={t('onboarding.household.childDetails.age6')}
          selected={currentChild.ageGroup === '6-15'}
          onPress={() => updateChild('ageGroup', '6-15')}
        />
        <OptionCard
          icon="🧑"
          label={t('onboarding.household.childDetails.age16')}
          selected={currentChild.ageGroup === '16-18'}
          onPress={() => updateChild('ageGroup', '16-18')}
        />
        <OptionCard
          icon="🧑‍🎓"
          label={t('onboarding.household.childDetails.age18')}
          selected={currentChild.ageGroup === '18+'}
          onPress={() => updateChild('ageGroup', '18+')}
        />
      </QuestionScreen>
    );
  }

  return null;
}
