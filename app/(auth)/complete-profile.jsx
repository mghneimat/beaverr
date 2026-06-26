import { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import AuthScreenLayout from '../../components/auth/AuthScreenLayout';
import AuthScreenCard from '../../components/auth/AuthScreenCard';
import CompleteProfileWrongAccount from '../../components/auth/CompleteProfileWrongAccount';
import AuthScreenSection from '../../components/auth/AuthScreenSection';
import AuthUsernameInput from '../../components/auth/AuthUsernameInput';
import SignUpLocationFields from '../../components/auth/SignUpLocationFields';
import GdprConsentModal from '../../components/consent/GdprConsentModal';
import GdprConsentCheckboxRow from '../../components/consent/GdprConsentCheckboxRow';
import { authInputStyle } from '../../lib/auth/authFieldStyles';
import {
  checkUsernameAvailable,
  isValidUsernameFormat,
} from '../../lib/auth/username';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthProvider';
import { navigateAfterAuth } from '../../lib/auth/navigateAfterAuth';
import { routeAfterAuth } from '../../lib/auth/routeAfterAuth';
import { hasCompletedProfile } from '../../lib/auth/profileGate';
import { ensureLocalDataForUser } from '../../lib/auth/userDataScope';
import { persistSignUpProfile } from '../../lib/auth/persistSignUpProfile';
import { claimProfileUsername } from '../../lib/cloud/householdRepository';
import { saveConsent } from '../../lib/consent';
import { COUNTRIES } from '../../lib/locationConstants';
import { C } from '../../constants/onboarding-theme';

/** @typedef {'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'checkFailed'} UsernameStatus */

/**
 * @param {import('@supabase/supabase-js').User | null | undefined} user
 */
function parseOAuthNames(user) {
  const meta = user?.user_metadata ?? {};
  const fullName = typeof meta.full_name === 'string' ? meta.full_name : '';
  const name = typeof meta.name === 'string' ? meta.name : fullName;
  const given = typeof meta.given_name === 'string' ? meta.given_name : '';
  const family = typeof meta.family_name === 'string' ? meta.family_name : '';

  if (given) {
    return { firstName: given, lastName: family };
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export default function CompleteProfileScreen() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const { user, signOut, pullCloudHousehold, loading } = useAuth();
  const defaultCountry = COUNTRIES.find((c) => c.code === 'CZ') ?? null;
  const parsedNames = parseOAuthNames(user);

  const [firstName, setFirstName] = useState(parsedNames.firstName);
  const [lastName, setLastName] = useState(parsedNames.lastName);
  const [username, setUsername] = useState('');
  /** @type {[UsernameStatus, React.Dispatch<React.SetStateAction<UsernameStatus>>]} */
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const usernameCheckRef = useRef(0);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [currency, setCurrency] = useState(defaultCountry?.currency ?? 'CZK');
  const [language, setLanguage] = useState(locale || 'en');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentModalVisible, setConsentModalVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/(auth)/welcome');
      return;
    }

    let active = true;
    hasCompletedProfile(user.id).then((complete) => {
      if (!active || !complete) return;
      routeAfterAuth(router, pullCloudHousehold, user.id);
    });

    return () => {
      active = false;
    };
  }, [user, loading, router, pullCloudHousehold]);

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus('idle');
      return undefined;
    }
    if (!isValidUsernameFormat(trimmed)) {
      setUsernameStatus('invalid');
      return undefined;
    }

    const checkId = usernameCheckRef.current + 1;
    usernameCheckRef.current = checkId;
    setUsernameStatus('checking');

    const timer = setTimeout(async () => {
      const result = await checkUsernameAvailable(trimmed);
      if (checkId !== usernameCheckRef.current) return;

      if (result.ok) {
        setUsernameStatus('available');
        return;
      }
      if (result.reason === 'taken') {
        setUsernameStatus('taken');
        return;
      }
      if (result.reason === 'invalid') {
        setUsernameStatus('invalid');
        return;
      }
      setUsernameStatus('checkFailed');
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  }, [signOut, router]);

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setCurrency(country.currency);
  };

  const handleSubmit = async () => {
    setError('');
    if (!firstName.trim() || !username.trim() || !selectedCountry) {
      setError(t('auth.errors.required'));
      return;
    }
    if (!isValidUsernameFormat(username)) {
      setError(t('auth.errors.usernameInvalid'));
      return;
    }
    if (!currency) {
      setError(t('auth.errors.currencyRequired'));
      return;
    }
    if (!consentAccepted) {
      setError(t('auth.errors.consentRequired'));
      return;
    }

    const userId = user?.id;
    if (!userId) {
      setError(t('auth.errors.signInFailed'));
      return;
    }

    await ensureLocalDataForUser(userId);

    setSubmitting(true);
    try {
      const availability = await checkUsernameAvailable(username);
      if (!availability.ok) {
        if (availability.reason === 'taken') {
          setError(t('auth.errors.usernameTaken'));
        } else if (availability.reason === 'invalid') {
          setError(t('auth.errors.usernameInvalid'));
        } else {
          setError(t('auth.errors.usernameCheckFailed'));
        }
        return;
      }

      const claim = await claimProfileUsername(userId, availability.username, language);
      if (!claim.ok) {
        setError(claim.reason === 'taken'
          ? t('auth.errors.usernameTaken')
          : t('auth.errors.signUpFailed'));
        return;
      }

      await persistSignUpProfile({
        firstName,
        lastName,
        username: availability.username,
        countryCode: selectedCountry.code,
        currency,
        language,
        setLocale,
      });

      await saveConsent();
      await navigateAfterAuth(router, pullCloudHousehold);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout>
      <AuthScreenCard
        title={t('auth.completeProfile.title')}
        noticeText={t('auth.completeProfile.helper')}
        errorText={error}
        submitLabel={t('auth.completeProfile.submit')}
        onSubmit={handleSubmit}
        submitDisabled={submitting}
        onBackPress={handleSignOut}
        switchSection={(
          <CompleteProfileWrongAccount
            user={user}
            onError={setError}
            disabled={submitting}
          />
        )}
      >
        <AuthScreenSection title={t('auth.completeProfile.sectionAccount')}>
          <View style={{ flexDirection: 'row', width: '100%', gap: 8, alignSelf: 'stretch' }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('auth.fields.firstNamePlaceholder')}
                placeholderTextColor={C.muted}
                autoCapitalize="words"
                accessibilityLabel={t('auth.fields.firstNamePlaceholder')}
                style={authInputStyle('filled', { inRow: true })}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('auth.fields.lastNamePlaceholder')}
                placeholderTextColor={C.muted}
                autoCapitalize="words"
                accessibilityLabel={t('auth.fields.lastNamePlaceholder')}
                style={authInputStyle('filled', { inRow: true })}
              />
            </View>
          </View>

          <AuthUsernameInput
            value={username}
            onChangeText={setUsername}
            status={usernameStatus}
          />
        </AuthScreenSection>

        <AuthScreenSection title={t('auth.signup.sectionPreferences')} showDivider>
          <SignUpLocationFields
            selectedCountry={selectedCountry}
            currency={currency}
            language={language}
            onCountryChange={handleCountryChange}
            onCurrencyChange={setCurrency}
            onLanguageChange={setLanguage}
          />
        </AuthScreenSection>

        <GdprConsentCheckboxRow
          checked={consentAccepted}
          onCheckedChange={setConsentAccepted}
          onOpenDetails={() => setConsentModalVisible(true)}
        />
      </AuthScreenCard>

      <GdprConsentModal
        visible={consentModalVisible}
        onClose={() => setConsentModalVisible(false)}
      />
    </AuthScreenLayout>
  );
}
