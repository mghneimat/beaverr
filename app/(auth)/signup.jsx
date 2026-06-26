import { useState, useEffect, useRef } from 'react';
import { View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import AuthScreenLayout from '../../components/auth/AuthScreenLayout';
import AuthScreenCard from '../../components/auth/AuthScreenCard';
import AuthScreenSection from '../../components/auth/AuthScreenSection';
import AuthUsernameInput from '../../components/auth/AuthUsernameInput';
import AuthEmailInput from '../../components/auth/AuthEmailInput';
import AuthPasswordInput from '../../components/auth/AuthPasswordInput';
import AuthConfirmPasswordInput from '../../components/auth/AuthConfirmPasswordInput';
import SignUpLocationFields from '../../components/auth/SignUpLocationFields';
import GdprConsentModal from '../../components/consent/GdprConsentModal';
import GdprConsentCheckboxRow from '../../components/consent/GdprConsentCheckboxRow';
import { authInputStyle } from '../../lib/auth/authFieldStyles';
import {
  checkUsernameAvailable,
  isValidUsernameFormat,
} from '../../lib/auth/username';
import { isValidEmail } from '../../lib/auth/email';
import { isValidPassword } from '../../lib/auth/password';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthProvider';
import { navigateAfterAuth } from '../../lib/auth/navigateAfterAuth';
import { ensureLocalDataForUser } from '../../lib/auth/userDataScope';
import { persistSignUpProfile } from '../../lib/auth/persistSignUpProfile';
import { signInWithPassword } from '../../lib/auth/authApi';
import { mapSignUpErrorKey } from '../../lib/auth/mapAuthError';
import { claimProfileUsername } from '../../lib/cloud/householdRepository';
import { saveConsent } from '../../lib/consent';
import { COUNTRIES } from '../../lib/locationConstants';
import { C } from '../../constants/onboarding-theme';

/** @typedef {'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'checkFailed'} UsernameStatus */

export default function SignUpScreen() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const { signUpWithPassword, pullCloudHousehold } = useAuth();
  const defaultCountry = COUNTRIES.find((c) => c.code === 'CZ') ?? null;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  /** @type {[UsernameStatus, React.Dispatch<React.SetStateAction<UsernameStatus>>]} */
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const usernameCheckRef = useRef(0);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [currency, setCurrency] = useState(defaultCountry?.currency ?? 'CZK');
  const [language, setLanguage] = useState(locale || 'en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentModalVisible, setConsentModalVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setCurrency(country.currency);
  };

  const handleSubmit = async () => {
    setError('');
    if (!firstName.trim() || !username.trim() || !email.trim() || !password || !selectedCountry) {
      setError(t('auth.errors.required'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('auth.errors.emailInvalid'));
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
    if (!isValidPassword(password)) {
      setError(t('auth.errors.passwordWeak'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }
    if (!consentAccepted) {
      setError(t('auth.errors.consentRequired'));
      return;
    }

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

      const result = await signUpWithPassword(email, password, { locale: language });
      if (!result.ok) {
        setError(t(`auth.errors.${mapSignUpErrorKey(result.error)}`));
        return;
      }

      let userId = result.session?.user?.id;
      if (!userId) {
        const signInResult = await signInWithPassword(email, password);
        if (!signInResult.ok) {
          setError(t('auth.errors.signUpFailed'));
          return;
        }
        userId = signInResult.session?.user?.id;
      }

      if (!userId) {
        setError(t('auth.errors.signUpFailed'));
        return;
      }

      await ensureLocalDataForUser(userId);

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
        title={t('auth.signup.title')}
        switchPrompt={t('auth.signup.switchPrompt')}
        switchLinkLabel={t('auth.signup.switchLink')}
        onSwitchPress={() => router.push('/(auth)/login')}
        switchA11yLabel={t('auth.signup.goToLogin')}
        errorText={error}
        submitLabel={t('auth.signup.submit')}
        onSubmit={handleSubmit}
        submitDisabled={submitting}
      >
        <AuthScreenSection title={t('auth.signup.sectionAccount')}>
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

          <AuthEmailInput
            value={email}
            onChangeText={setEmail}
          />

          <AuthPasswordInput
            value={password}
            onChangeText={setPassword}
          />

          <AuthConfirmPasswordInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            password={password}
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
