import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AuthScreenLayout from '../../components/auth/AuthScreenLayout';
import AuthScreenCard from '../../components/auth/AuthScreenCard';
import AuthEmailInput from '../../components/auth/AuthEmailInput';
import AuthSecureTextInput from '../../components/auth/AuthSecureTextInput';
import AuthSocialButtons from '../../components/auth/AuthSocialButtons';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthProvider';
import { routeAfterAuth } from '../../lib/auth/routeAfterAuth';
import { isValidEmail } from '../../lib/auth/email';
import { completePendingSignUpIfAny } from '../../lib/auth/pendingSignUp';

export default function LoginScreen() {
  const { t, setLocale } = useI18n();
  const router = useRouter();
  const { session, loading, signInWithPassword, pullCloudHousehold } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !session?.user?.id) return;
    routeAfterAuth(router, pullCloudHousehold, session.user.id);
  }, [loading, session, router, pullCloudHousehold]);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError(t('auth.errors.required'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('auth.errors.emailInvalid'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await signInWithPassword(email, password);
      if (!result.ok) {
        setError(t('auth.errors.signInFailed'));
        return;
      }

      const userId = result.session?.user?.id;
      if (userId) {
        await completePendingSignUpIfAny(userId, { setLocale });
      }

      if (userId) {
        await routeAfterAuth(router, pullCloudHousehold, userId);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout centerContent>
      <AuthScreenCard
        title={t('auth.login.title')}
        switchPrompt={t('auth.login.switchPrompt')}
        switchLinkLabel={t('auth.login.switchLink')}
        onSwitchPress={() => router.push('/(auth)/signup')}
        switchA11yLabel={t('auth.login.goToSignUp')}
        errorText={error}
        submitLabel={t('auth.login.submit')}
        onSubmit={handleSubmit}
        submitDisabled={submitting}
      >
        <AuthSocialButtons onError={setError} disabled={submitting} />

        <AuthEmailInput
          value={email}
          onChangeText={setEmail}
        />

        <AuthSecureTextInput
          value={password}
          onChangeText={setPassword}
          variant="filled"
          placeholder={t('auth.fields.passwordPlaceholder')}
          accessibilityLabel={t('auth.fields.password')}
        />
      </AuthScreenCard>
    </AuthScreenLayout>
  );
}
