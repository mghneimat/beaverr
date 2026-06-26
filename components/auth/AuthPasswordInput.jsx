import { useState } from 'react';
import { View, Text as RNText } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import AuthSecureTextInput from './AuthSecureTextInput';
import { useI18n } from '../../lib/i18n';
import { getPasswordCriteria, isValidPassword } from '../../lib/auth/password';
import { C, T } from '../../constants/onboarding-theme';

/**
 * @param {{ met: boolean, label: string }} props
 */
function PasswordCriterion({ met, label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <RNText
        accessibilityLabel={label}
        style={{
          color: met ? C.positive : C.muted,
          fontSize: 14,
          fontWeight: '700',
          lineHeight: 18,
          width: 16,
          textAlign: 'center',
        }}
      >
        {met ? '✓' : '·'}
      </RNText>
      <Text style={{ ...T.hint, color: met ? C.positive : C.muted }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Password field with live requirement feedback.
 */
export default function AuthPasswordInput({ value, onChangeText, variant = 'filled' }) {
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);
  const criteria = getPasswordCriteria(value);
  const allMet = isValidPassword(value);

  return (
    <View style={{ width: '100%', gap: 6 }}>
      <AuthSecureTextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        variant={variant}
        placeholder={t('auth.fields.passwordPlaceholder')}
        accessibilityLabel={t('auth.fields.password')}
      />

      {focused ? (
        <View
          accessibilityLiveRegion="polite"
          style={{ gap: 2, marginTop: 2 }}
        >
          <PasswordCriterion
            met={criteria.minLength}
            label={t('auth.fields.passwordHintMinLength')}
          />
          <PasswordCriterion
            met={criteria.hasLetter}
            label={t('auth.fields.passwordHintLetter')}
          />
          <PasswordCriterion
            met={criteria.hasNumber}
            label={t('auth.fields.passwordHintNumber')}
          />
          {allMet ? (
            <Text style={{ ...T.hint, marginTop: 2, color: C.positive }}>
              {t('auth.fields.passwordValid')}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
