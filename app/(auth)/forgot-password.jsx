import { useState } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@gluestack-ui/themed';
import AuthScreenLayout from '../../components/auth/AuthScreenLayout';
import AuthScreenCard from '../../components/auth/AuthScreenCard';
import AuthEmailInput from '../../components/auth/AuthEmailInput';
import { useI18n } from '../../lib/i18n';
import { resetPasswordForEmail } from '../../lib/auth/authApi';
import { isValidEmail } from '../../lib/auth/email';
import { C } from '../../constants/onboarding-theme';

export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError(t('auth.errors.required'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('auth.errors.emailInvalid'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await resetPasswordForEmail(email);
      if (!result.ok) {
        setError(t('auth.errors.resetEmailFailed'));
        return;
      }
      setNotice(t('auth.forgotPassword.success'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout centerContent>
      <AuthScreenCard
        title={t('auth.forgotPassword.title')}
        footnote={t('auth.forgotPassword.helper')}
        errorText={error}
        noticeText={notice}
        submitLabel={t('auth.forgotPassword.submit')}
        onSubmit={handleSubmit}
        submitDisabled={submitting}
        onBackPress={() => router.replace('/(auth)/login')}
        switchSection={(
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            accessibilityRole="link"
            accessibilityLabel={t('auth.forgotPassword.backToLoginA11y')}
            hitSlop={8}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: C.accent, textAlign: 'center', textDecorationLine: 'underline' }}>
              {t('auth.forgotPassword.backToLogin')}
            </Text>
          </Pressable>
        )}
      >
        <AuthEmailInput value={email} onChangeText={setEmail} />
      </AuthScreenCard>
    </AuthScreenLayout>
  );
}
