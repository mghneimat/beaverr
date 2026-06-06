import { useState, useEffect } from 'react';
import { View, TextInput, Pressable, ScrollView, Modal, FlatList } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PlaceholderIllustration from '../../components/onboarding/PlaceholderIllustration';

/** @type {Array<{ code: string, name: string, currency: string, region: string }>} */
const COUNTRIES = [
  // Priority: CZ first
  { code: 'CZ', name: 'Czech Republic', nameCs: 'Česká republika', currency: 'CZK', region: 'EU' },
  // Other EU
  { code: 'SK', name: 'Slovakia', nameCs: 'Slovensko', currency: 'EUR', region: 'EU' },
  { code: 'PL', name: 'Poland', nameCs: 'Polsko', currency: 'PLN', region: 'EU' },
  { code: 'DE', name: 'Germany', nameCs: 'Německo', currency: 'EUR', region: 'EU' },
  { code: 'AT', name: 'Austria', nameCs: 'Rakousko', currency: 'EUR', region: 'EU' },
  { code: 'HU', name: 'Hungary', nameCs: 'Maďarsko', currency: 'HUF', region: 'EU' },
  { code: 'FR', name: 'France', nameCs: 'Francie', currency: 'EUR', region: 'EU' },
  { code: 'IT', name: 'Italy', nameCs: 'Itálie', currency: 'EUR', region: 'EU' },
  { code: 'ES', name: 'Spain', nameCs: 'Španělsko', currency: 'EUR', region: 'EU' },
  { code: 'NL', name: 'Netherlands', nameCs: 'Nizozemsko', currency: 'EUR', region: 'EU' },
  { code: 'BE', name: 'Belgium', nameCs: 'Belgie', currency: 'EUR', region: 'EU' },
  { code: 'SE', name: 'Sweden', nameCs: 'Švédsko', currency: 'SEK', region: 'EU' },
  { code: 'DK', name: 'Denmark', nameCs: 'Dánsko', currency: 'DKK', region: 'EU' },
  { code: 'FI', name: 'Finland', nameCs: 'Finsko', currency: 'EUR', region: 'EU' },
  { code: 'IE', name: 'Ireland', nameCs: 'Irsko', currency: 'EUR', region: 'EU' },
  { code: 'PT', name: 'Portugal', nameCs: 'Portugalsko', currency: 'EUR', region: 'EU' },
  { code: 'RO', name: 'Romania', nameCs: 'Rumunsko', currency: 'RON', region: 'EU' },
  { code: 'BG', name: 'Bulgaria', nameCs: 'Bulharsko', currency: 'BGN', region: 'EU' },
  { code: 'GR', name: 'Greece', nameCs: 'Řecko', currency: 'EUR', region: 'EU' },
  { code: 'HR', name: 'Croatia', nameCs: 'Chorvatsko', currency: 'EUR', region: 'EU' },
  { code: 'SI', name: 'Slovenia', nameCs: 'Slovinsko', currency: 'EUR', region: 'EU' },
  { code: 'LT', name: 'Lithuania', nameCs: 'Litva', currency: 'EUR', region: 'EU' },
  { code: 'LV', name: 'Latvia', nameCs: 'Lotyšsko', currency: 'EUR', region: 'EU' },
  { code: 'EE', name: 'Estonia', nameCs: 'Estonsko', currency: 'EUR', region: 'EU' },
  // Other
  { code: 'GB', name: 'United Kingdom', nameCs: 'Spojené království', currency: 'GBP', region: 'Other' },
  { code: 'CH', name: 'Switzerland', nameCs: 'Švýcarsko', currency: 'CHF', region: 'Other' },
  { code: 'NO', name: 'Norway', nameCs: 'Norsko', currency: 'NOK', region: 'Other' },
  { code: 'US', name: 'United States', nameCs: 'Spojené státy', currency: 'USD', region: 'Other' },
  { code: 'CA', name: 'Canada', nameCs: 'Kanada', currency: 'CAD', region: 'Other' },
  { code: 'AU', name: 'Australia', nameCs: 'Austrálie', currency: 'AUD', region: 'Other' },
  { code: 'NZ', name: 'New Zealand', nameCs: 'Nový Zéland', currency: 'NZD', region: 'Other' },
  { code: 'JP', name: 'Japan', nameCs: 'Japonsko', currency: 'JPY', region: 'Other' },
  { code: 'KR', name: 'South Korea', nameCs: 'Jižní Korea', currency: 'KRW', region: 'Other' },
  { code: 'CN', name: 'China', nameCs: 'Čína', currency: 'CNY', region: 'Other' },
  { code: 'IN', name: 'India', nameCs: 'Indie', currency: 'INR', region: 'Other' },
  { code: 'RU', name: 'Russia', nameCs: 'Rusko', currency: 'RUB', region: 'Other' },
  { code: 'UA', name: 'Ukraine', nameCs: 'Ukrajina', currency: 'UAH', region: 'Other' },
  { code: 'Other', name: 'Other', nameCs: 'Jiné', currency: 'EUR', region: 'Other' },
];

/**
 * Convert a 2-letter country code to a flag emoji.
 * @param {string} countryCode - ISO 3166-1 alpha-2 code
 * @returns {string} Flag emoji
 */
function getFlagEmoji(countryCode) {
  if (countryCode === 'Other' || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 0x1F1E6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

/** @type {Array<{ code: string, name: string, symbol: string }>} */
const CURRENCIES = [
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
];

export default function LocationScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    async function loadData() {
      const location = await getData('pocketos_location');
      if (location) {
        const match = COUNTRIES.find(c => c.code === location.country);
        setSelectedCountry(match || null);
        setCity(location.city || '');
        setCurrency(location.currency || '');
      }
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

    await setData('pocketos_location', locationData);

    await setData('pocketos_onboarding', {
      completed: false,
      currentStep: 'location',
      percentComplete: 30,
    });

    router.replace('/(onboarding)/occupation');
  };

  const countryLabel = selectedCountry
    ? (locale === 'cs' && selectedCountry.nameCs ? selectedCountry.nameCs : selectedCountry.name)
    : '';

  const inputBase = {
    backgroundColor: '#FDFCFA',
    borderWidth: 1.5,
    borderColor: '#E4E2DC',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '300',
  };

  return (
    <QuestionScreen
      chapter={t('onboarding.location.chapter')}
      title={t('onboarding.location.title')}
      helper={t('onboarding.location.helper')}
      illustration={<PlaceholderIllustration />}
      onContinue={handleContinue}
      onBack={() => router.replace('/(onboarding)/splash-location')}
      validationError={validationError}
      progress={20}
      progressLabel={t('onboarding.progress', { percent: '20' })}
    >
      {/* Country dropdown trigger */}
      <Text style={{ fontSize: 13, fontWeight: '500', color: '#7A7770', marginBottom: 6 }}>
        {t('onboarding.location.countryLabel')}
      </Text>
      <Pressable
        onPress={() => setShowDropdown(true)}
        style={{
          ...inputBase,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <Text style={{
          fontSize: 17,
          fontWeight: selectedCountry ? '400' : '300',
          color: selectedCountry ? '#1A1A1A' : '#C4C2BC',
        }}>
          {selectedCountry ? `${getFlagEmoji(selectedCountry.code)} ${countryLabel}` : t('onboarding.location.countryPlaceholder')}
        </Text>
        <Text style={{ fontSize: 14, color: '#7A7770' }}>{'▼'}</Text>
      </Pressable>

      {/* Country dropdown modal */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => { setShowDropdown(false); setSearchQuery(''); }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: '#FDFCFA',
              borderRadius: 14,
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
              borderBottomColor: '#E4E2DC',
            }}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('onboarding.location.countryPlaceholder')}
                placeholderTextColor={'#C4C2BC'}
                style={{
                  fontSize: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: '#F4F3EF',
                  borderRadius: 8,
                  color: '#1A1A1A',
                }}
                autoFocus
              />
            </View>

            {/* Country list */}
            <ScrollView style={{ maxHeight: 380 }}>
              {filteredCountries.map((country) => {
                const isSelected = selectedCountry?.code === country.code;
                const label = locale === 'cs' && country.nameCs ? country.nameCs : country.name;
                return (
                  <Pressable
                    key={country.code}
                    onPress={() => handleSelectCountry(country)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? 'rgba(29,53,87,0.05)' : 'transparent',
                      borderBottomWidth: 0.5,
                      borderBottomColor: '#F4F3EF',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={{
                        fontSize: 16,
                        color: isSelected ? '#1D3557' : '#1A1A1A',
                        fontWeight: isSelected ? '500' : '400',
                      }}>
                        {label}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#C4C2BC', marginLeft: 8 }}>
                        {country.currency}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Text style={{ color: '#1D3557', fontSize: 14 }}>{'✓'}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
              {filteredCountries.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#C4C2BC', fontSize: 14 }}>No countries found</Text>
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* City / Region */}
      <Text style={{ fontSize: 13, fontWeight: '500', color: '#7A7770', marginBottom: 6 }}>
        {t('onboarding.location.cityLabel')}
      </Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder={t('onboarding.location.cityPlaceholder')}
        placeholderTextColor={'#C4C2BC'}
        style={{
          ...inputBase,
          marginBottom: 20,
        }}
        maxLength={60}
      />

      {/* Currency dropdown */}
      <Text style={{ fontSize: 13, fontWeight: '500', color: '#7A7770', marginBottom: 6 }}>
        {t('onboarding.location.currencyLabel')}
      </Text>
      <Pressable
        onPress={() => setShowCurrencyDropdown(true)}
        style={{
          ...inputBase,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{
          fontSize: 17,
          fontWeight: '400',
          color: currency ? '#1A1A1A' : '#C4C2BC',
        }}>
          {currency || 'Select currency'}
        </Text>
        <Text style={{ fontSize: 14, color: '#7A7770' }}>{'▼'}</Text>
      </Pressable>

      {/* Currency dropdown modal */}
      <Modal visible={showCurrencyDropdown} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowCurrencyDropdown(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: '#FDFCFA',
              borderRadius: 14,
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
                  <Pressable
                    onPress={() => {
                      setCurrency(item.code);
                      setShowCurrencyDropdown(false);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? 'rgba(29,53,87,0.05)' : 'transparent',
                      borderBottomWidth: 0.5,
                      borderBottomColor: '#F4F3EF',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={{
                        fontSize: 16,
                        color: isSelected ? '#1D3557' : '#1A1A1A',
                        fontWeight: isSelected ? '500' : '400',
                      }}>
                        {item.code}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#C4C2BC', marginLeft: 8 }}>
                        {item.name} ({item.symbol})
                      </Text>
                    </View>
                    {isSelected ? (
                      <Text style={{ color: '#1D3557', fontSize: 14 }}>{'✓'}</Text>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </QuestionScreen>
  );
}
