import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PlaceholderIllustration from '../../components/onboarding/PlaceholderIllustration';
import PillToggle from '../../components/onboarding/PillToggle';
import DatePicker from '../../components/onboarding/DatePicker';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import AddAnotherButton from '../../components/onboarding/AddAnotherButton';

const PET_TYPES = ['dog', 'cat', 'bird', 'other'];
const FREQUENCIES = ['monthly', 'quarterly', 'annual'];

export default function PetsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  // ── Loaded data ──
  const [currency, setCurrency] = useState('Kč');

  const [step, setStep] = useState('q10');
  const [validationError, setValidationError] = useState('');

  // Q10 — Has pets
  const [hasPets, setHasPets] = useState(null);

  // Q10a — Pet details
  const [pets, setPets] = useState([]);
  const [petIndex, setPetIndex] = useState(0);

  const currentPet = pets[petIndex];

  // ── Load currency from location data ──
  useEffect(() => {
    (async () => {
      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrency(loc.currency);
    })();
  }, []);

  const handleContinue = async () => {
    setValidationError('');

    if (step === 'q10') {
      if (hasPets === null) {
        setValidationError(t('onboarding.pets.q10.validation'));
        return;
      }
      if (hasPets) {
        if (pets.length === 0) addPet();
        setPetIndex(0);
        setStep('q10a');
      } else {
        await setData('pocketos_pets', []);
        await setData('pocketos_onboarding', {
          completed: false,
          currentStep: 'pets',
          percentComplete: 80,
        });
        router.replace('/(onboarding)/splash-subscriptions');
      }
      return;
    }

    if (step === 'q10a') {
      // Validate current pet
      if (!currentPet.type) {
        setValidationError(t('onboarding.pets.q10a.validation'));
        return;
      }

      // If there are more pets to configure, go to next
      if (petIndex < pets.length - 1) {
        setPetIndex(petIndex + 1);
        return;
      }

      // All pets configured — save and continue
      await setData('pocketos_pets', pets);
      await setData('pocketos_onboarding', {
        completed: false,
        currentStep: 'pets',
        percentComplete: 80,
      });
      router.replace('/(onboarding)/splash-subscriptions');
      return;
    }
  };

  const handleBack = async () => {
    setValidationError('');
    if (step === 'q10a') {
      if (petIndex > 0) {
        setPetIndex(petIndex - 1);
      } else {
        setStep('q10');
      }
      return;
    }
    // Save pets data before navigating back
    await setData('pocketos_pets', pets);
    router.replace('/(onboarding)/splash-pets');
  };

  const updatePet = (idx, updates) => {
    const updated = [...pets];
    updated[idx] = { ...updated[idx], ...updates };
    setPets(updated);
  };

  const addPet = () => {
    const newPet = {
      type: null,
      name: '',
      foodAmount: '',
      foodFrequency: 'monthly',
      vetAmount: '',
      vetFrequency: 'annual',
      hasInsurance: null,
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
  };

  const removePet = (idx) => {
    const newPets = pets.filter((_, i) => i !== idx);
    setPets(newPets);
    if (petIndex >= newPets.length && petIndex > 0) {
      setPetIndex(petIndex - 1);
    }
  };

  const progress = 80;
  const progressLabel = t('onboarding.progress', { percent: progress });

  const renderQ10 = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.pets.q10.helper')}
      </Text>
      <YesNoToggle
        value={hasPets}
        onChange={(val) => { setHasPets(val); setValidationError(''); }}
        yesLabel={t('onboarding.pets.q10.yes')}
        noLabel={t('onboarding.pets.q10.no')}
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
    { key: 'food', labelKey: 'onboarding.pets.q10a.foodLabel', amountField: 'foodAmount', freqField: 'foodFrequency' },
    { key: 'vet', labelKey: 'onboarding.pets.q10a.vetLabel', amountField: 'vetAmount', freqField: 'vetFrequency' },
    { key: 'grooming', labelKey: 'onboarding.pets.q10a.groomingLabel', amountField: 'groomingAmount', freqField: 'groomingFrequency' },
    { key: 'otherCost', labelKey: 'onboarding.pets.q10a.otherCostLabel', amountField: 'otherCostAmount', freqField: 'otherCostFrequency' },
  ];

  const renderCostSectionPill = (pet, idx, section) => {
    const isActive = pet.activeCostSections?.[section.key];
    return (
      <Pressable
        key={section.key}
        onPress={() => toggleCostSection(idx, section.key)}
        style={({ pressed }) => ({
          width: '48%',
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: isActive ? C.primary : pressed ? C.placeholder : C.border,
          backgroundColor: isActive
            ? C.chipSelectedBg
            : pressed
              ? C.bg
              : C.surface,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Text style={{
          fontSize: 13,
          fontWeight: isActive ? '600' : '500',
          color: isActive ? C.primary : C.muted,
          marginRight: isActive ? 6 : 0,
        }}>
          {t(section.labelKey)}
        </Text>
        {isActive && (
          <View style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: C.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{'✓'}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderCostSectionContent = (pet, idx, section) => {
    const isActive = pet.activeCostSections?.[section.key];
    const placeholderKey = section.key === 'food' ? 'foodPlaceholder'
      : section.key === 'vet' ? 'vetPlaceholder'
      : section.key === 'grooming' ? 'groomingPlaceholder'
      : 'otherCostPlaceholder';
    return (
      <AnimatedSlideIn visible={isActive} key={section.key}>
        {/* Proper label above the input */}
        <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600', marginBottom: 6 }}>
          {t(section.labelKey)}
        </Text>
        <LabeledInput
          label={t(section.labelKey)}
          value={pet[section.amountField]}
          onChangeText={(v) => updatePet(idx, { [section.amountField]: v })}
          numeric
          placeholder={t(`onboarding.pets.q10a.${placeholderKey}`)}
          large
          containerStyle={{ marginBottom: 8 }}
          currency={currency}
        />
        <FrequencyPills
          options={FREQUENCIES}
          value={pet[section.freqField]}
          onChange={(freq) => updatePet(idx, { [section.freqField]: freq })}
          small
          containerStyle={{ marginBottom: 16 }}
        />
      </AnimatedSlideIn>
    );
  };

  const renderPetForm = (pet, idx) => (
    <View key={idx} style={{ marginBottom: 24, padding: 16, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }}>
          {t('onboarding.pets.q10a.title', { n: idx + 1 })}
        </Text>
        {pets.length > 1 && (
          <Pressable
            onPress={() => removePet(idx)}
            style={({ pressed, hovered }) => ({
              width: 32,
              height: 32,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: hovered ? 'rgba(209,64,64,0.1)' : pressed ? 'rgba(209,64,64,0.15)' : 'transparent',
            })}
          >
            <Text style={{ fontSize: 18, color: '#D14040', fontWeight: '600', lineHeight: 20 }}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Pet type pills */}
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
        {t('onboarding.pets.q10a.typeLabel')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 16 }}>
        {PET_TYPES.map(type => (
          <PillToggle
            key={type}
            label={t(`onboarding.pets.q10a.${type}`)}
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
        label={t('onboarding.pets.q10a.nameLabel')}
        value={pet.name}
        onChangeText={(v) => updatePet(idx, { name: v })}
        placeholder={t('onboarding.pets.q10a.namePlaceholder')}
        containerStyle={{ marginBottom: 16 }}
      />

      {/* Cost section pills — selectable, multiple at a time */}
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
        {t('onboarding.pets.q10a.costsLabel')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
        {COST_SECTIONS.map(section => renderCostSectionPill(pet, idx, section))}
      </View>

      {/* Animated cost section contents */}
      {COST_SECTIONS.map(section => renderCostSectionContent(pet, idx, section))}

      {/* Pet insurance */}
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
        {t('onboarding.pets.q10a.insuranceLabel')}
      </Text>
      <YesNoToggle
        value={pet.hasInsurance}
        onChange={(val) => updatePet(idx, { hasInsurance: val })}
        containerStyle={{ marginBottom: 12 }}
      />
      <AnimatedSlideIn visible={pet.hasInsurance === true}>
        <LabeledInput
          label={t('onboarding.pets.q10a.insurancePremiumLabel')}
          value={pet.insurancePremium}
          onChangeText={(v) => updatePet(idx, { insurancePremium: v })}
          numeric
          placeholder={t('onboarding.pets.q10a.insurancePremiumPlaceholder')}
          large
          containerStyle={{ marginBottom: 12 }}
          currency={currency}
        />
        <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600', marginBottom: 6 }}>
          {t('onboarding.pets.q10a.insuranceRenewalLabel')}
        </Text>
        <DatePicker
          value={pet.insuranceRenewalDate}
          onChange={(v) => updatePet(idx, { insuranceRenewalDate: v })}
        />
      </AnimatedSlideIn>

      {/* Spacing between insurance and dog tax */}
      <View style={{ height: 12 }} />

      {/* Dog-specific: dog tax (CZ) */}
      {pet.type === 'dog' && (
        <View style={{ padding: 12, backgroundColor: C.chipSelectedBg, borderRadius: 8, borderWidth: 1, borderColor: C.border, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: C.primary, fontWeight: '500' }}>
              {t('onboarding.pets.q10a.dogTaxLabel')}
            </Text>
            <Pressable
              onPress={() => updatePet(idx, { dogTax: !pet.dogTax })}
              style={{
                paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6,
                backgroundColor: pet.dogTax ? C.chipSelectedBg : C.bg,
              }}
            >
              <Text style={{ fontSize: 12, color: pet.dogTax ? C.primary : C.muted, fontWeight: '500' }}>
                {pet.dogTax ? t('common.yes') : t('common.no')}
              </Text>
            </Pressable>
          </View>
          <AnimatedSlideIn visible={pet.dogTax}>
            <LabeledInput
              label={t('onboarding.pets.q10a.dogTaxLabel')}
              value={pet.dogTaxAmount}
              onChangeText={(v) => updatePet(idx, { dogTaxAmount: v })}
              numeric
              placeholder="1 500"
              large
              currency={currency}
            />
            <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>{t('onboarding.pets.q10a.dogTaxHelper')}</Text>
          </AnimatedSlideIn>
        </View>
      )}
    </View>
  );

  const renderQ10a = () => {
    if (!currentPet) return null;

    return (
      <View>
        {/* Stepper indicator */}
        {pets.length > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {pets.map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: idx === petIndex ? C.primary : C.divider,
                }}
              />
            ))}
          </View>
        )}

        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.pets.q10a.helper')}
        </Text>

        {renderPetForm(currentPet, petIndex)}

        {/* Add another pet button */}
        <AddAnotherButton
          label={t('onboarding.pets.q10a.addPet')}
          onPress={addPet}
        />
      </View>
    );
  };

  const stepTitles = {
    q10: t('onboarding.pets.q10.title'),
    q10a: t('onboarding.pets.q10a.heading'),
  };

  return (
    <QuestionScreen
      chapter={t('onboarding.pets.chapter')}
      title={stepTitles[step]}
      illustration={<PlaceholderIllustration />}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
      progress={progress}
      progressLabel={progressLabel}
      animationKey={step}
    >
      {step === 'q10' && renderQ10()}
      {step === 'q10a' && renderQ10a()}
    </QuestionScreen>
  );
}
