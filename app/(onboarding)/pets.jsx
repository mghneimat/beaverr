import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text } from 'react-native';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import { listRowBg } from '../../components/onboarding/pressableFeedback';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import PetsWithHalloweenCostumesCuateIllustration from '../../components/onboarding/PetsWithHalloweenCostumesCuateIllustration';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PillToggle from '../../components/onboarding/PillToggle';
import SplitDateFields from '../../components/onboarding/SplitDateFields';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import AddAnotherButton from '../../components/onboarding/AddAnotherButton';
import SuggestionChip from '../../components/onboarding/SuggestionChip';
import AnimatedRow from '../../components/onboarding/AnimatedRow';
import CostCard from '../../components/onboarding/CostCard';
import InputGroup from '../../components/onboarding/InputGroup';
import OptionalPaymentDatesFields from '../../components/onboarding/OptionalPaymentDatesFields';
import RemoveButton from '../../components/onboarding/RemoveButton';
import ScrollFocusAnchor from '../../components/onboarding/ScrollFocusAnchor';
import { useSectionExit } from '../../lib/finishOnboardingSection';

const PET_TYPES = ['dog', 'cat', 'bird', 'other'];
const FREQUENCIES = ['monthly', 'quarterly', 'annual'];

export default function PetsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  // ── Loaded data ──
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  const [step, setStep] = useState('hasPets');
  const [validationError, setValidationError] = useState('');

  // hasPets — Has pets
  const [hasPets, setHasPets] = useState(false);

  // petDetails — Pet details
  const [pets, setPets] = useState([]);
  const [petIndex, setPetIndex] = useState(0);
  const [focusToken, setFocusToken] = useState(null);
  const finalizedPetRemovals = useRef(new Set());

  const currentPet = pets[petIndex];

  // ── Load currency from location data ──
  useEffect(() => {
    (async () => {
      const loc = await getData('beaverr_location');
      if (loc?.currency) setCurrencyCode(loc.currency);
    })();
  }, []);

  const persistPets = async () => {
    const data = hasPets === false ? [] : pets;
    await completeSection({
      persist: async () => { await setData('beaverr_pets', data); },
      onboardingPatch: { completed: false, currentStep: 'pets', percentComplete: 80 },
      nextRoute: '/(onboarding)/splash-subscriptions',
      routeName: 'pets',
    });
  };

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await persistPets();
      return;
    }

    if (step === 'hasPets') {
      if (hasPets) {
        if (pets.length === 0) addPet();
        setPetIndex(0);
        setStep('petDetails');
      } else {
        await completeSection({
          persist: async () => { await setData('beaverr_pets', []); },
          onboardingPatch: { completed: false, currentStep: 'pets', percentComplete: 80 },
          nextRoute: '/(onboarding)/splash-subscriptions',
          routeName: 'pets',
        });
      }
      return;
    }

    if (step === 'petDetails') {
      const invalidIdx = pets.findIndex((p) => !p.type);
      if (invalidIdx !== -1) {
        setPetIndex(invalidIdx);
        setValidationError(t('onboarding.pets.petDetails.validation'));
        return;
      }

      await completeSection({
        persist: async () => { await setData('beaverr_pets', pets); },
        onboardingPatch: { completed: false, currentStep: 'pets', percentComplete: 80 },
        nextRoute: '/(onboarding)/splash-subscriptions',
        routeName: 'pets',
      });
      return;
    }
  };

  const handleBack = async () => {
    setValidationError('');
    if (step === 'petDetails') {
      setStep('hasPets');
      return;
    }
    await setData('beaverr_pets', pets);
    leaveSection(() => navigateBack());
  };

  const updatePet = (idx, updates) => {
    const updated = [...pets];
    updated[idx] = { ...updated[idx], ...updates };
    setPets(updated);
  };

  const addPet = () => {
    const id = `pet_${Date.now()}`;
    const newPet = {
      id,
      visible: true,
      type: null,
      name: '',
      foodAmount: '',
      foodFrequency: 'monthly',
      vetAmount: '',
      vetFrequency: 'annual',
      hasInsurance: false,
      insurancePremium: '',
      insuranceFrequency: 'annual',
      insuranceRenewalDate: '',
      groomingAmount: '',
      groomingFrequency: 'monthly',
      otherCostAmount: '',
      otherCostFrequency: 'monthly',
      dogTax: true,
      dogTaxAmount: '1500',
      activeCostSections: {},
    };
    setPets([...pets, newPet]);
    setPetIndex(pets.length);
    setFocusToken(id);
  };

  const removePet = (idx) => {
    setPets((prev) => prev.map((p, i) => (i === idx ? { ...p, visible: false } : p)));
  };

  const finalizeRemovePet = (idx) => {
    const pet = pets[idx];
    const key = pet?.id || String(idx);
    if (finalizedPetRemovals.current.has(key)) return;
    finalizedPetRemovals.current.add(key);

    setPets((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setPetIndex((current) => {
        if (current >= next.length && current > 0) return next.length - 1;
        if (current === idx && idx > 0) return idx - 1;
        return current;
      });
      return next;
    });
  };

  const progress = 80;
  const screenProgress = isEditMode ? undefined : progress;

  const renderHasPets = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.pets.hasPets.helper')}
      </Text>
      <YesNoToggle
        value={hasPets}
        onChange={(val) => { setHasPets(val); setValidationError(''); }}
        yesLabel={t('onboarding.pets.hasPets.yes')}
        noLabel={t('onboarding.pets.hasPets.no')}
      />
    </View>
  );

  const toggleCostSection = useCallback((idx, section) => {
    const pet = pets[idx];
    if (!pet) return;
    const current = pet.activeCostSections?.[section];
    updatePet(idx, {
      activeCostSections: { ...pet.activeCostSections, [section]: !current },
    });
  }, [pets, updatePet]);

  const COST_SECTIONS = [
    { key: 'food', labelKey: 'onboarding.pets.petDetails.foodLabel', amountField: 'foodAmount', freqField: 'foodFrequency' },
    { key: 'vet', labelKey: 'onboarding.pets.petDetails.vetLabel', amountField: 'vetAmount', freqField: 'vetFrequency' },
    { key: 'grooming', labelKey: 'onboarding.pets.petDetails.groomingLabel', amountField: 'groomingAmount', freqField: 'groomingFrequency' },
    { key: 'otherCost', labelKey: 'onboarding.pets.petDetails.otherCostLabel', amountField: 'otherCostAmount', freqField: 'otherCostFrequency' },
  ];

  const renderCostSectionPill = (pet, idx, section) => (
    <SuggestionChip
      key={section.key}
      label={t(section.labelKey)}
      active={Boolean(pet.activeCostSections?.[section.key])}
      onPress={() => toggleCostSection(idx, section.key)}
    />
  );

  const renderCostSectionContent = (pet, idx, section) => {
    const isActive = pet.activeCostSections?.[section.key];
    const placeholderKey = section.key === 'food' ? 'foodPlaceholder'
      : section.key === 'vet' ? 'vetPlaceholder'
      : section.key === 'grooming' ? 'groomingPlaceholder'
      : 'otherCostPlaceholder';
    return (
      <AnimatedSlideIn visible={isActive} key={section.key}>
        <CostCard title={t(section.labelKey)} style={{ marginBottom: 16 }}>
          <InputGroup nested label={t('onboarding.pets.petDetails.amountLabel')}>
            <LabeledInput
              value={pet[section.amountField]}
              onChangeText={(v) => updatePet(idx, { [section.amountField]: v })}
              numeric
              placeholder={t(`onboarding.pets.petDetails.${placeholderKey}`)}
              large
              inGroup
              currency={currency}
            />
            <FrequencyPills
              options={FREQUENCIES}
              value={pet[section.freqField]}
              onChange={(freq) => updatePet(idx, { [section.freqField]: freq })}
              small
            />
          </InputGroup>
          {section.key === 'food' || section.key === 'vet' ? (
            <OptionalPaymentDatesFields
              prefix={section.key}
              values={pet}
              onChange={(patch) => updatePet(idx, patch)}
              compact
            />
          ) : null}
        </CostCard>
      </AnimatedSlideIn>
    );
  };

  const renderPetForm = (pet, idx) => (
    <View key={idx} style={{ marginBottom: 24, padding: 16, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }}>
          {t('onboarding.pets.petDetails.title', { n: idx + 1 })}
        </Text>
        {pets.length > 1 ? <RemoveButton onPress={() => removePet(idx)} /> : null}
      </View>

      {/* Pet type pills */}
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
        {t('onboarding.pets.petDetails.typeLabel')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 16 }}>
        {PET_TYPES.map(type => (
          <PillToggle
            key={type}
            label={t(`onboarding.pets.petDetails.${type}`)}
            selected={pet.type === type}
            onPress={() => updatePet(idx, { type })}
            paddingVertical={10}
            fontSize={13}
            fontWeight="500"
          />
        ))}
      </View>

      {/* Pet name */}
      <LabeledInput
        label={t('onboarding.pets.petDetails.nameLabel')}
        value={pet.name}
        onChangeText={(v) => updatePet(idx, { name: v })}
        placeholder={t('onboarding.pets.petDetails.namePlaceholder')}
        containerStyle={{ marginBottom: 16 }}
      />

      {/* Cost section pills — selectable, multiple at a time */}
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
        {t('onboarding.pets.petDetails.costsLabel')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
        {COST_SECTIONS.map(section => renderCostSectionPill(pet, idx, section))}
      </View>

      {/* Animated cost section contents */}
      {COST_SECTIONS.map(section => renderCostSectionContent(pet, idx, section))}

      {/* Pet insurance */}
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
        {t('onboarding.pets.petDetails.insuranceLabel')}
      </Text>
      <YesNoToggle
        value={pet.hasInsurance}
        onChange={(val) => updatePet(idx, { hasInsurance: val })}
        containerStyle={{ marginBottom: 12 }}
      />
      <AnimatedSlideIn visible={pet.hasInsurance === true}>
        <InputGroup label={t('onboarding.pets.petDetails.insurancePremiumLabel')}>
          <LabeledInput
            value={pet.insurancePremium}
            onChangeText={(v) => updatePet(idx, { insurancePremium: v })}
            numeric
            placeholder={t('onboarding.pets.petDetails.insurancePremiumPlaceholder')}
            large
            inGroup
            currency={currency}
          />
        </InputGroup>
        <InputGroup label={t('onboarding.pets.petDetails.insuranceEndDateLabel')} style={{ marginTop: 12 }}>
          <SplitDateFields
            value={pet.insuranceRenewalDate}
            onChange={(v) => updatePet(idx, { insuranceRenewalDate: v })}
            inGroup
            yearEnd={new Date().getFullYear() + 10}
          />
        </InputGroup>
      </AnimatedSlideIn>

      {/* Spacing between insurance and dog tax */}
      <View style={{ height: 12 }} />

      {/* Dog-specific: dog tax (CZ) */}
      {pet.type === 'dog' && (
        <View style={{
          padding: 16,
          backgroundColor: C.surface,
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: C.border,
          marginBottom: 8,
        }}>
          <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
            {t('onboarding.pets.petDetails.dogTaxLabel')}
          </Text>
          <YesNoToggle
            value={pet.dogTax}
            onChange={(val) => updatePet(idx, { dogTax: val })}
            containerStyle={{ marginBottom: 12 }}
          />
          <AnimatedSlideIn visible={pet.dogTax}>
            <InputGroup label={t('onboarding.pets.petDetails.dogTaxLabel')}>
              <LabeledInput
                value={pet.dogTaxAmount}
                onChangeText={(v) => updatePet(idx, { dogTaxAmount: v })}
                numeric
                placeholder="1 500"
                large
                inGroup
                currency={currency}
              />
            </InputGroup>
            <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>{t('onboarding.pets.petDetails.dogTaxHelper')}</Text>
          </AnimatedSlideIn>
        </View>
      )}
    </View>
  );

  const renderPetDetails = () => {
    if (!currentPet) return null;

    return (
      <View>
        {/* Stepper indicator */}
        {pets.length > 1 && (
          <View style={{ flexDirection: 'row', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 16 }}>
            {pets.map((pet, idx) => (
              <AnimatedRow
                key={pet.id || idx}
                visible={pet.visible !== false}
                style={{ flex: 1, marginBottom: 0 }}
                onAnimationEnd={() => {
                  if (pet.visible === false) finalizeRemovePet(idx);
                }}
              >
                <OnboardingPressable
                  onPress={() => { setPetIndex(idx); setValidationError(''); }}
                  style={({ pressed, hovered }) => ({
                    flex: 1,
                    paddingVertical: 10,
                    backgroundColor: listRowBg({ pressed, hovered, selected: petIndex === idx, selectedBg: C.pillSelectedBg }),
                    alignItems: 'center',
                  })}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: petIndex === idx ? '600' : '500',
                    color: petIndex === idx ? C.pillSelectedText : C.pillUnselectedText,
                  }}>
                    {pet.name || t('onboarding.pets.petDetails.petLabel', { n: String(idx + 1) })}
                  </Text>
                </OnboardingPressable>
              </AnimatedRow>
            ))}
          </View>
        )}

        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.pets.petDetails.helper')}
        </Text>

        <ScrollFocusAnchor focusId={currentPet.id} focusToken={focusToken}>
          <AnimatedRow
            visible={currentPet.visible !== false}
            onAnimationEnd={() => {
              if (currentPet.visible === false) finalizeRemovePet(petIndex);
            }}
          >
            {renderPetForm(currentPet, petIndex)}
          </AnimatedRow>
        </ScrollFocusAnchor>

        <AddAnotherButton
          label={t('onboarding.pets.petDetails.addPet')}
          onPress={addPet}
          style={{ marginTop: 8, width: '100%', alignSelf: 'stretch' }}
        />
      </View>
    );
  };

  const stepTitles = {
    hasPets: t('onboarding.pets.hasPets.title'),
    petDetails: t('onboarding.pets.petDetails.heading'),
  };

  return (
    <QuestionScreen
      illustration={<PetsWithHalloweenCostumesCuateIllustration width={layout.illustrationWidth} />}
      chapter={t('onboarding.pets.chapter')}
      title={stepTitles[step]}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
        setValidationError={setValidationError}
      continueLabel={editContinueLabel}
      animationKey={step}
    >
      {step === 'hasPets' && renderHasPets()}
      {step === 'petDetails' && renderPetDetails()}
    </QuestionScreen>
  );
}
