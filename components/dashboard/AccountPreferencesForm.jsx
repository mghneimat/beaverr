import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import SignUpLocationFields from '../auth/SignUpLocationFields';
import PrimaryButton from '../ui/PrimaryButton';
import TextLinkButton from '../ui/TextLinkButton';
import FormActionFooter from './FormActionFooter';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthProvider';
import {
  loadPreferenceRegistrationFields,
  savePreferenceRegistrationFields,
} from '../../lib/account/registrationProfile';
import { C, T } from '../../constants/onboarding-theme';

export default function AccountPreferencesForm() {
  const { t, setLocale } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [currency, setCurrency] = useState('CZK');
  const [language, setLanguage] = useState('en');
  const [savedCountry, setSavedCountry] = useState(null);
  const [savedCurrency, setSavedCurrency] = useState('CZK');
  const [savedLanguage, setSavedLanguage] = useState('en');
  const [error, setError] = useState('');

  const applyFields = useCallback((fields) => {
    setSelectedCountry(fields.selectedCountry);
    setCurrency(fields.currency);
    setLanguage(fields.language);
    setSavedCountry(fields.selectedCountry);
    setSavedCurrency(fields.currency);
    setSavedLanguage(fields.language);
  }, []);

  const loadFields = useCallback(async () => {
    setLoading(true);
    try {
      const fields = await loadPreferenceRegistrationFields();
      applyFields(fields);
    } finally {
      setLoading(false);
    }
  }, [applyFields]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setCurrency(country.currency);
  };

  const handleEdit = () => {
    setError('');
    setEditing(true);
  };

  const handleCancel = () => {
    setError('');
    setSelectedCountry(savedCountry);
    setCurrency(savedCurrency);
    setLanguage(savedLanguage);
    setEditing(false);
  };

  const handleSave = async () => {
    setError('');

    if (!selectedCountry) {
      setError(t('auth.errors.required'));
      return;
    }

    setSaving(true);
    try {
      const result = await savePreferenceRegistrationFields({
        countryCode: selectedCountry.code,
        currency,
        language,
        userId: user?.id,
        setLocale,
      });

      if (!result.ok) {
        setError(t(result.error === 'required' ? 'auth.errors.required' : 'common.error'));
        return;
      }

      setSavedCountry(selectedCountry);
      setSavedCurrency(currency);
      setSavedLanguage(language);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Text style={{ ...T.helper, color: C.muted }}>
        {t('common.loading')}
      </Text>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <Text style={{ ...T.helper, color: C.muted }}>
        {t('dashboard.accountSettingsScreen.preferencesHelper')}
      </Text>

      <SignUpLocationFields
        selectedCountry={selectedCountry}
        currency={currency}
        language={language}
        onCountryChange={handleCountryChange}
        onCurrencyChange={setCurrency}
        onLanguageChange={setLanguage}
        disabled={!editing}
      />

      {error ? (
        <Text style={{ ...T.helper, color: C.danger }}>
          {error}
        </Text>
      ) : null}

      {editing ? (
        <>
          <PrimaryButton onPress={handleSave} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </PrimaryButton>
          <FormActionFooter>
            <TextLinkButton
              label={t('common.cancel')}
              onPress={handleCancel}
              disabled={saving}
              centered
            />
          </FormActionFooter>
        </>
      ) : (
        <FormActionFooter>
          <TextLinkButton label={t('common.edit')} onPress={handleEdit} centered />
        </FormActionFooter>
      )}
    </View>
  );
}
