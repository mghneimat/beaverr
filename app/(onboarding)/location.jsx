import { useState, useEffect } from 'react';
import { View, TextInput, Pressable, ScrollView, Modal, FlatList } from 'react-native';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import DropdownTrigger, { DropdownTriggerReadOnly } from '../../components/onboarding/DropdownTrigger';
import { listRowBg } from '../../components/onboarding/pressableFeedback';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { patchOnboardingState } from '../../lib/onboardingProgress';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import LabeledInput from '../../components/onboarding/LabeledInput';
import CurrentLocationIllustration from '../../components/onboarding/CurrentLocationIllustration';
import { getCurrencySymbol } from '../../lib/currency';
import {
  COUNTRIES,
  CURRENCIES,
  PRE_ALPHA_COUNTRY_CODE,
  getFlagEmoji,
} from '../../lib/locationConstants';
import { C, T, R, S, INPUT_FIELD } from '../../constants/onboarding-theme';

export default function LocationScreen() {
  const { t, locale } = useI18n();
  const layout = useOnboardingLayout();

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    async function loadData() {
      const location = await getData('beaverr_location');
      if (location) {
        const match = COUNTRIES.find(c => c.code === location.country);
        setSelectedCountry(match || null);
        setCity(location.city || '');
        setCurrency(location.currency || '');
        return;
      }
      const cz = COUNTRIES.find((c) => c.code === 'CZ');
      setSelectedCountry(cz ?? null);
      setCurrency(cz?.currency ?? '');
    }
    loadData();
  }, []);

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setCurrency(country.currency);
    setShowDropdown(false);
    setSearchQuery('');
    setValidationError('');
  };

  const filteredCountries = COUNTRIES.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.nameCs && c.nameCs.toLowerCase().includes(q)) ||
      c.code.toLowerCase().includes(q)
    );
  });

  const handleContinue = async () => {
    if (!selectedCountry) {
      setValidationError(t('onboarding.location.validation'));
      return;
    }

    const locationData = {
      country: selectedCountry.code,
      city: city.trim() || null,
      currency,
    };

    await setData('beaverr_location', locationData);

    await patchOnboardingState({
      completed: false,
      currentStep: 'location',
      resumeRoute: '/(onboarding)/citizenship',
    });

    navigateForward('/(onboarding)/citizenship');
  };

  const handleSaveDraft = async () => {
    if (!selectedCountry) return;
    await setData('beaverr_location', {
      country: selectedCountry.code,
      city: city.trim() || null,
      currency,
    });
  };

  const countryLabel = selectedCountry
    ? (locale === 'cs' && selectedCountry.nameCs ? selectedCountry.nameCs : selectedCountry.name)
    : '';

  const inputBase = {
    backgroundColor: C.surface,
    borderWidth: 2.5,
    borderColor: C.border,
    borderRadius: R.input,
    paddingHorizontal: INPUT_FIELD.paddingHorizontal,
    paddingVertical: INPUT_FIELD.paddingVertical,
    minHeight: INPUT_FIELD.minHeight,
    color: C.text,
    fontSize: 17,
    fontWeight: '400',
    textAlignVertical: 'center',
  };

  const currencyLocked = selectedCountry != null && selectedCountry.code !== 'Other';
  const selectedCurrency = CURRENCIES.find((c) => c.code === currency);
  const currencyDisplay = selectedCurrency
    ? `${selectedCurrency.symbol} — ${selectedCurrency.name} (${selectedCurrency.code})`
    : currency
      ? getCurrencySymbol(currency)
      : '';

  return (
    <QuestionScreen
      animationKey="location"
      chapter={t('onboarding.location.chapter')}
      illustration={<CurrentLocationIllustration width={layout.illustrationWidth} />}
      title={t('onboarding.location.title')}
      helper={t('onboarding.location.helper')}
      onContinue={handleContinue}
      onBack={() => navigateBack()}
      onSaveDraft={handleSaveDraft}
      resumeRoute="/(onboarding)/location"
      validationError={validationError}
      setValidationError={setValidationError}
    >
      {/* Country dropdown trigger */}
      <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>
        {t('onboarding.location.countryLabel')}
      </Text>
      <DropdownTrigger
        onPress={() => setShowDropdown(true)}
        value={selectedCountry ? `${getFlagEmoji(selectedCountry.code)} ${countryLabel}` : null}
        placeholder={t('onboarding.location.countryPlaceholder')}
        style={{ ...inputBase, marginBottom: 8 }}
      />
      <View
        accessibilityRole="alert"
        style={{
          padding: 12,
          paddingHorizontal: 14,
          marginBottom: 20,
          backgroundColor: C.infoBg,
          borderRadius: R.input,
          borderWidth: 1,
          borderColor: C.infoBorder,
        }}
      >
        <Text style={{ ...T.caption, color: C.infoText, lineHeight: 18 }}>
          {t('onboarding.location.countryPreAlphaNote')}
        </Text>
      </View>

      {/* Country dropdown modal */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => { setShowDropdown(false); setSearchQuery(''); }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: C.surface,
              borderRadius: R.card,
              maxHeight: 480,
              width: '100%',
              maxWidth: 520,
              overflow: 'hidden',
              marginHorizontal: 20,
            }}
          >
            {/* Search input */}
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('onboarding.location.countryPlaceholder')}
                placeholderTextColor={C.placeholder}
                style={{
                  fontSize: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: C.bg,
                  borderRadius: 8,
                  color: C.text,
                }}
                autoFocus
              />
            </View>

            {/* Country list */}
            <ScrollView style={{ maxHeight: 380 }}>
              {filteredCountries.map((country) => {
                const isSelected = selectedCountry?.code === country.code;
                const isEnabled = country.code === PRE_ALPHA_COUNTRY_CODE;
                const label = locale === 'cs' && country.nameCs ? country.nameCs : country.name;
                return (
                  <OnboardingPressable
                    key={country.code}
                    disabled={!isEnabled}
                    onPress={() => isEnabled && handleSelectCountry(country)}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !isEnabled, selected: isSelected }}
                    accessibilityLabel={
                      isEnabled
                        ? label
                        : t('onboarding.location.countryUnavailableA11y', { country: label })
                    }
                    style={({ pressed, hovered }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: isEnabled
                        ? listRowBg({ pressed, hovered, selected: isSelected, selectedBg: C.overlayHover })
                        : 'transparent',
                      borderBottomWidth: 0.5,
                      borderBottomColor: C.bg,
                      opacity: isEnabled ? 1 : 0.45,
                    })}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <Text style={{
                          fontSize: 16,
                          color: isSelected ? C.primary : isEnabled ? C.text : C.muted,
                          fontWeight: isSelected ? '500' : '400',
                        }}>
                          {label}
                        </Text>
                        <Text style={{ fontSize: 12, color: C.placeholder, marginLeft: 8 }}>
                          {getCurrencySymbol(country.currency)}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Text style={{ color: C.primary, fontSize: 14, marginLeft: 8 }}>{'✓'}</Text>
                      ) : null}
                    </View>
                  </OnboardingPressable>
                );
              })}
              {filteredCountries.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: C.placeholder, fontSize: 14 }}>{t('onboarding.location.noCountriesFound')}</Text>
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <LabeledInput
        label={t('onboarding.location.cityLabel')}
        optional
        value={city}
        onChangeText={setCity}
        placeholder={t('onboarding.location.cityPlaceholder')}
        maxLength={60}
      />

      {/* Currency — locked to country unless "Other" */}
      <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>
        {t('onboarding.location.currencyLabel')}
      </Text>
      {currencyLocked ? (
        <DropdownTriggerReadOnly
          value={currencyDisplay}
          style={{ ...inputBase, marginBottom: 16 }}
        />
      ) : (
        <DropdownTrigger
          onPress={() => setShowCurrencyDropdown(true)}
          value={currencyDisplay || null}
          placeholder={t('onboarding.location.currencyPlaceholder')}
          style={{ ...inputBase, marginBottom: 16 }}
        />
      )}

      {/* Currency dropdown modal */}
      <Modal visible={showCurrencyDropdown} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowCurrencyDropdown(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: C.surface,
              borderRadius: R.card,
              maxHeight: 400,
              width: '100%',
              maxWidth: 520,
              overflow: 'hidden',
              marginHorizontal: 20,
            }}
          >
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = currency === item.code;
                return (
                  <OnboardingPressable
                    onPress={() => {
                      setCurrency(item.code);
                      setShowCurrencyDropdown(false);
                    }}
                    style={({ pressed, hovered }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: listRowBg({ pressed, hovered, selected: isSelected, selectedBg: C.overlayHover }),
                      borderBottomWidth: 0.5,
                      borderBottomColor: C.bg,
                    })}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <Text style={{
                          fontSize: 16,
                          color: isSelected ? C.primary : C.text,
                          fontWeight: isSelected ? '500' : '400',
                        }}>
                          {item.symbol}
                        </Text>
                        <Text style={{ fontSize: 13, color: C.placeholder, marginLeft: 8 }}>
                          {item.name} ({item.code})
                        </Text>
                      </View>
                      {isSelected ? (
                        <Text style={{ color: C.primary, fontSize: 14, marginLeft: 8 }}>{'✓'}</Text>
                      ) : null}
                    </View>
                  </OnboardingPressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </QuestionScreen>
  );
}
