import { useMemo, useState } from 'react';
import { View, TextInput, Modal, ScrollView, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import OnboardingPressable from '../onboarding/OnboardingPressable';
import DropdownTrigger from '../onboarding/DropdownTrigger';
import { listRowBg } from '../onboarding/pressableFeedback';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import { authDropdownShellStyle } from '../../lib/auth/authFieldStyles';
import {
  COUNTRIES,
  CURRENCIES,
  PRE_ALPHA_COUNTRY_CODE,
  PRE_ALPHA_CURRENCY_CODE,
  getFlagEmoji,
} from '../../lib/locationConstants';
import { C, R } from '../../constants/onboarding-theme';

const LANGUAGE_OPTIONS = [
  { code: 'en', labelKey: 'auth.fields.languageEn' },
  { code: 'cs', labelKey: 'auth.fields.languageCs' },
];

/**
 * Country, language, and currency pickers for sign-up.
 */
export default function SignUpLocationFields({
  selectedCountry,
  currency,
  language,
  onCountryChange,
  onCurrencyChange,
  onLanguageChange,
  disabled = false,
}) {
  const { t, locale } = useI18n();
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const countryLabel = selectedCountry
    ? (locale === 'cs' && selectedCountry.nameCs ? selectedCountry.nameCs : selectedCountry.name)
    : '';

  const selectedLanguage = LANGUAGE_OPTIONS.find((opt) => opt.code === language);
  const languageDisplay = selectedLanguage ? t(selectedLanguage.labelKey) : '';

  const enabledCurrencyCode = selectedCountry?.code === 'Other'
    ? PRE_ALPHA_CURRENCY_CODE
    : (selectedCountry?.currency ?? PRE_ALPHA_CURRENCY_CODE);

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency);
  const currencyDisplay = selectedCurrency
    ? `${selectedCurrency.symbol} — ${selectedCurrency.name} (${selectedCurrency.code})`
    : currency
      ? getCurrencySymbol(currency)
      : '';

  const filteredCountries = useMemo(() => COUNTRIES.filter((c) => {
    const q = countrySearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q)
      || (c.nameCs && c.nameCs.toLowerCase().includes(q))
      || c.code.toLowerCase().includes(q)
    );
  }), [countrySearch]);

  return (
    <View style={{ gap: 12, width: '100%' }}>
      <DropdownTrigger
        onPress={() => setShowCountryDropdown(true)}
        value={selectedCountry ? `${getFlagEmoji(selectedCountry.code)} ${countryLabel}` : null}
        placeholder={t('auth.fields.countryPlaceholder')}
        style={authDropdownShellStyle('filled')}
        disabled={disabled}
      />

      <DropdownTrigger
        onPress={() => setShowLanguageDropdown(true)}
        value={languageDisplay || null}
        placeholder={t('auth.fields.languagePlaceholder')}
        style={authDropdownShellStyle('filled')}
        disabled={disabled}
      />

      <DropdownTrigger
        onPress={() => setShowCurrencyDropdown(true)}
        value={currencyDisplay || null}
        placeholder={t('auth.fields.currencyPlaceholder')}
        style={authDropdownShellStyle('filled')}
        disabled={disabled}
      />

      <Modal visible={!disabled && showCountryDropdown} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowCountryDropdown(false)}
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
            <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <TextInput
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder={t('auth.fields.countryPlaceholder')}
                placeholderTextColor={C.muted}
                style={{
                  fontSize: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: C.bg,
                  borderRadius: 8,
                  color: C.primary,
                }}
              />
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {filteredCountries.map((country) => {
                const isSelected = selectedCountry?.code === country.code;
                const isEnabled = country.code === PRE_ALPHA_COUNTRY_CODE;
                const label = locale === 'cs' && country.nameCs ? country.nameCs : country.name;
                return (
                  <OnboardingPressable
                    key={country.code}
                    disabled={!isEnabled}
                    onPress={() => {
                      if (!isEnabled) return;
                      onCountryChange(country);
                      setShowCountryDropdown(false);
                      setCountrySearch('');
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !isEnabled, selected: isSelected }}
                    style={({ pressed, hovered }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: isEnabled
                        ? listRowBg({ pressed, hovered, selected: isSelected, selectedBg: C.overlayHover })
                        : 'transparent',
                      opacity: isEnabled ? 1 : 0.45,
                    })}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: isSelected ? C.primary : isEnabled ? C.text : C.muted,
                      fontWeight: isSelected ? '500' : '400',
                    }}
                    >
                      {getFlagEmoji(country.code)} {label}
                    </Text>
                  </OnboardingPressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!disabled && showLanguageDropdown} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowLanguageDropdown(false)}
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
            <ScrollView style={{ maxHeight: 380 }}>
              {LANGUAGE_OPTIONS.map((opt) => {
                const isSelected = language === opt.code;
                return (
                  <OnboardingPressable
                    key={opt.code}
                    onPress={() => {
                      onLanguageChange(opt.code);
                      setShowLanguageDropdown(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed, hovered }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: listRowBg({
                        pressed,
                        hovered,
                        selected: isSelected,
                        selectedBg: C.overlayHover,
                      }),
                    })}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: isSelected ? C.primary : C.text,
                      fontWeight: isSelected ? '500' : '400',
                    }}
                    >
                      {t(opt.labelKey)}
                    </Text>
                  </OnboardingPressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!disabled && showCurrencyDropdown} transparent animationType="fade">
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
            <ScrollView style={{ maxHeight: 380 }}>
              {CURRENCIES.map((item) => {
                const isSelected = currency === item.code;
                const isEnabled = item.code === enabledCurrencyCode;
                return (
                  <OnboardingPressable
                    key={item.code}
                    disabled={!isEnabled}
                    onPress={() => {
                      if (!isEnabled) return;
                      onCurrencyChange(item.code);
                      setShowCurrencyDropdown(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !isEnabled, selected: isSelected }}
                    style={({ pressed, hovered }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: isEnabled
                        ? listRowBg({
                          pressed,
                          hovered,
                          selected: isSelected,
                          selectedBg: C.overlayHover,
                        })
                        : 'transparent',
                      opacity: isEnabled ? 1 : 0.45,
                    })}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: isSelected ? C.primary : isEnabled ? C.text : C.muted,
                      fontWeight: isSelected ? '500' : '400',
                    }}
                    >
                      {item.symbol} — {item.name} ({item.code})
                    </Text>
                  </OnboardingPressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
