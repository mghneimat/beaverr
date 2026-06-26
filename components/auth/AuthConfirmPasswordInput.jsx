import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import FieldError from '../onboarding/FieldError';
import AuthSecureTextInput from './AuthSecureTextInput';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';

/**
 * Confirm-password field with live mismatch feedback.
 */
export default function AuthConfirmPasswordInput({ value, onChangeText, password }) {
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);
  const showMismatch = value.length > 0 && value !== password;
  const showMatch = focused && value.length > 0 && value === password;

  return (
    <View style={{ width: '100%' }}>
      <AuthSecureTextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        variant="filled"
        placeholder={t('auth.fields.confirmPasswordPlaceholder')}
        accessibilityLabel={t('auth.fields.confirmPassword')}
      />
      {showMismatch ? <FieldError message={t('auth.errors.passwordMismatch')} /> : null}
      {showMatch ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ ...T.hint, marginTop: 4, color: C.positive }}
        >
          {t('auth.fields.confirmPasswordMatch')}
        </Text>
      ) : null}
    </View>
  );
}