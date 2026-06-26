import { useState, useCallback, useRef, useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { getOnboardingState, patchOnboardingState, patchProgressOnSectionComplete } from '../../lib/onboardingProgress';
import { getQuickSetupNextRoute, isQuickSetupMode } from '../../lib/onboardingQuickPath';
import { navigateBack, navigateForward, recordVisit } from '../../lib/onboardingNavigation';
import {
  buildHouseholdResumeRoute,
  computeHouseholdReturnPoint,
  householdNavParams,
  persistHouseholdDraft,
  resolveHouseholdReturnPoint,
} from '../../lib/householdOnboardingSave';
import { useOnboardingMultiStep } from '../../lib/useOnboardingMultiStep';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { C, T } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import OptionCard from '../../components/onboarding/OptionCard';
import LabeledInput from '../../components/onboarding/LabeledInput';
import QuantityStepper from '../../components/onboarding/QuantityStepper';
import HouseholdChillingIllustration from '../../components/onboarding/HouseholdChillingIllustration';
import HouseholdPartnerIllustration from '../../components/onboarding/HouseholdPartnerIllustration';
import HouseholdChildrenIllustration from '../../components/onboarding/HouseholdChildrenIllustration';
import HouseholdTrueFriendsIllustration from '../../components/onboarding/HouseholdTrueFriendsIllustration';
import ChildrenRafikiIllustration from '../../components/onboarding/ChildrenRafikiIllustration';

function readRouteParam(value) {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function readChildIndexParam(value) {
  const raw = readRouteParam(value);
  if (raw == null) return 0;
  return Math.max(0, parseInt(String(raw), 10) || 0);
}

export default function HouseholdScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const layout = useOnboardingLayout();
  const urlStep = readRouteParam(params.step);
  const urlChildIndex = readChildIndexParam(params.childIndex);
  const [householdType, setHouseholdType] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [hasChildren, setHasChildren] = useState(false);
  const [numChildren, setNumChildren] = useState(1);
  const [children, setChildren] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [isResumingChildStep, setIsResumingChildStep] = useState(urlStep === 'childDetails');
  const loadedNumChildrenRef = useRef(1);

  const {
    step: currentStep,
    setStep: setCurrentStep,
    childIndex: currentChildIndex,
    setChildIndex: setCurrentChildIndex,
  } = useOnboardingMultiStep('household', {
    defaultStep: 'type',
    childIndex: urlChildIndex,
    onFocus: async () => {
      const household = await getData('beaverr_household');

      let loadedChildren = [];
      let loadedNumChildren = 1;
      let loadedHasChildren = false;

      if (household) {
        setHouseholdType(household.type || '');
        setPartnerName(household.partnerName || '');
        if (household.hasChildren === false) {
          loadedHasChildren = false;
        } else if (household.hasChildren || (household.children && household.children.length > 0)) {
          loadedHasChildren = true;
          loadedNumChildren = household.numChildren || household.children.length;
          loadedChildren = Array.from({ length: loadedNumChildren }, (_, i) => ({
            displayName: household.children[i]?.displayName || '',
            ageGroup: household.children[i]?.ageGroup || '',
          }));
        }
      }

      loadedNumChildrenRef.current = loadedNumChildren;
      setHasChildren(loadedHasChildren);
      setNumChildren(loadedNumChildren);
      setChildren(loadedChildren);
      setIsResumingChildStep(false);
    },
    loadStepFromStorage: (household) => {
      const returnPoint = resolveHouseholdReturnPoint(household);
      if (returnPoint.step === 'childDetails') {
        returnPoint.childIndex = Math.min(
          returnPoint.childIndex,
          Math.max(0, loadedNumChildrenRef.current - 1),
        );
      }
      return {
        step: returnPoint.step,
        childIndex: returnPoint.childIndex,
      };
    },
  });

  useEffect(() => {
    if (urlStep === 'childDetails') {
      setIsResumingChildStep(true);
    }
  }, [urlStep]);

  const handleSaveDraft = useCallback(async () => {
    await persistHouseholdDraft({
      householdType,
      partnerName,
      hasChildren,
      numChildren,
      children,
      currentStep,
      currentChildIndex,
    });
  }, [householdType, partnerName, hasChildren, numChildren, children, currentStep, currentChildIndex]);

  const resumeRoute = buildHouseholdResumeRoute(currentStep, currentChildIndex);

  const handleBack = async () => {
    setValidationError('');
    if (currentStep === 'type') {
      navigateBack();
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
      } else if (householdType === 'solo') {
        setHasChildren(false);
        await saveAndContinue();
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
      const onboarding = await getOnboardingState();
      if (isQuickSetupMode(onboarding)) {
        const placeholders = Array.from({ length: numChildren }, () => ({
          displayName: null,
          ageGroup: '',
        }));
        setChildren(placeholders);
        await saveAndContinue(placeholders);
        return;
      }
      setCurrentChildIndex(0);
      setCurrentStep('childDetails');
    } else if (currentStep === 'childDetails') {
      const currentChild = children[currentChildIndex];
      if (!currentChild) {
        return;
      }
      if (!currentChild.displayName?.trim()) {
        setValidationError(t('onboarding.household.childDetails.nameValidation'));
        return;
      }
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

  const saveAndContinue = async (childrenOverride) => {
    const childrenData = childrenOverride ?? (hasChildren ? children : []);
    const householdData = {
      type: householdType,
      partnerName: householdType === 'partner' ? partnerName : null,
      children: hasChildren ? childrenData : [],
    };

    const returnPoint = computeHouseholdReturnPoint({
      householdType,
      hasChildren,
      numChildren,
    });

    const existing = (await getData('beaverr_household')) || {};
    await setData('beaverr_household', {
      ...existing,
      ...householdData,
      householdOnboardingStep: returnPoint.step,
      householdOnboardingChildIndex: returnPoint.childIndex,
      numChildren,
      hasChildren,
    });

    const onboarding = await getOnboardingState();
    const quickMode = isQuickSetupMode(onboarding);

    await patchProgressOnSectionComplete('household');
    await patchOnboardingState({
      completed: false,
      setupMode: quickMode ? 'quick' : 'full',
      currentStep: 'household',
      resumeRoute: quickMode
        ? getQuickSetupNextRoute('household')
        : '/(onboarding)/splash-residence',
    });

    recordVisit('/(onboarding)/household', householdNavParams(returnPoint.step, returnPoint.childIndex));
    navigateForward(quickMode ? getQuickSetupNextRoute('household') : '/(onboarding)/splash-residence');
  };

  const sharedScreenProps = {
    chapter: t('onboarding.splashHousehold.chapter'),
    onContinue: handleContinue,
    onBack: handleBack,
    validationError,
    setValidationError,
    progressStep: currentStep,
    progressChildIndex: currentStep === 'childDetails' ? currentChildIndex : undefined,
    resumeRoute,
    onSaveDraft: handleSaveDraft,
  };

  const updateChild = (field, value) => {
    const newChildren = [...children];
    newChildren[currentChildIndex] = {
      ...newChildren[currentChildIndex],
      [field]: value,
    };
    setChildren(newChildren);
  };

  // Q1: Household Type
  if (currentStep === 'type') {
    return (
      <QuestionScreen
        {...sharedScreenProps}
        animationKey={currentStep}
        illustration={<HouseholdChillingIllustration width={layout.illustrationWidth} />}
        title={t('onboarding.household.type.title')}
        helper={t('onboarding.household.type.helper')}
      >
        <OptionCard
          label={t('onboarding.household.type.solo')}
          selected={householdType === 'solo'}
          onPress={() => setHouseholdType('solo')}
        />
        <OptionCard
          label={t('onboarding.household.type.partner')}
          selected={householdType === 'partner'}
          onPress={() => setHouseholdType('partner')}
        />
        <OptionCard
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
        {...sharedScreenProps}
        animationKey={currentStep}
        illustration={<HouseholdPartnerIllustration width={layout.illustrationWidth} />}
        title={t('onboarding.household.partnerName.title')}
        helper={t('onboarding.household.partnerName.helper')}
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
        {...sharedScreenProps}
        animationKey={currentStep}
        illustration={<HouseholdChildrenIllustration width={layout.illustrationWidth} />}
        title={t('onboarding.household.children.title')}
        helper={t('onboarding.household.children.helper')}
      >
        <View style={{ gap: 10 }}>
          <OptionCard
            label={t('common.no')}
            selected={hasChildren === false}
            onPress={() => setHasChildren(false)}
          />
          <OptionCard
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
    return (
      <QuestionScreen
        {...sharedScreenProps}
        animationKey={currentStep}
        illustration={<HouseholdTrueFriendsIllustration width={layout.illustrationWidth} />}
        title={t('onboarding.household.numChildren.title')}
        helper={t('onboarding.household.numChildren.helper')}
      >
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <QuantityStepper
            value={numChildren}
            min={1}
            max={10}
            onDecrement={() => setNumChildren(numChildren - 1)}
            onIncrement={() => setNumChildren(numChildren + 1)}
          />

          <Text style={{ ...T.hint, color: C.muted, marginTop: 12 }}>
            {numChildren === 1
              ? t('onboarding.household.numChildren.profileHintSingle')
              : t('onboarding.household.numChildren.profileHintPlural', { count: numChildren })}
          </Text>
        </View>
      </QuestionScreen>
    );
  }

  // Q2b: Child Details
  if (currentStep === 'childDetails') {
    if (isResumingChildStep) {
      return null;
    }

    const currentChild = children[currentChildIndex];
    if (!currentChild) {
      return null;
    }

    const nameValidationMsg = t('onboarding.household.childDetails.nameValidation');
    const isNameValidation = validationError === nameValidationMsg;

    return (
      <QuestionScreen
        {...sharedScreenProps}
        animationKey={`childDetails-${currentChildIndex}`}
        illustration={<ChildrenRafikiIllustration width={layout.illustrationWidth} />}
        title={t('onboarding.household.childDetails.title', { n: currentChildIndex + 1 })}
        helper={t('onboarding.household.childDetails.helper')}
        validationError={isNameValidation ? '' : validationError}
      >
        <LabeledInput
          label={t('onboarding.household.childDetails.nameLabel')}
          required
          value={currentChild.displayName}
          onChangeText={(value) => updateChild('displayName', value)}
          placeholder={t('onboarding.household.childDetails.namePlaceholder')}
          maxLength={30}
          containerStyle={{ marginBottom: 20 }}
          errorText={isNameValidation ? validationError : validationError ? '' : undefined}
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
