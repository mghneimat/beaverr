import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import FieldError from '../onboarding/FieldError';
import AuthFieldCircleCheck from './AuthFieldCircleCheck';
import { useI18n } from '../../lib/i18n';
import { authInputStyle } from '../../lib/auth/authFieldStyles';
import { isValidEmail } from '../../lib/auth/email';
import { C, T, INPUT_FIELD } from '../../constants/onboarding-theme';

/**
 * Email field with inline format validation.
 */
export default function AuthEmailInput({ value, onChangeText }) {
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);
  const trimmed = value.trim();
  const isValid = trimmed.length > 0 && isValidEmail(trimmed);
  const showInvalid = trimmed.length > 0 && !isValidEmail(trimmed);
  const showTrailing = isValid;

  return (
    <View style={{ width: '100%' }}>
      <View style={{ position: 'relative', width: '100%' }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t('auth.fields.emailPlaceholder')}
          placeholderTextColor={C.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t('auth.fields.email')}
          style={[
            authInputStyle('outlined'),
            showTrailing ? { paddingRight: 44 } : null,
          ]}
        />
        {isValid ? (
          <View
            pointerEvents="none"
            accessibilityLabel={t('auth.fields.emailValid')}
            style={{
              position: 'absolute',
              right: 14,
              top: 0,
              height: INPUT_FIELD.minHeight,
              justifyContent: 'center',
            }}
          >
            <AuthFieldCircleCheck />
          </View>
        ) : null}
      </View>

      {showInvalid ? <FieldError message={t('auth.errors.emailInvalid')} /> : null}
      {isValid && focused ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ ...T.hint, marginTop: 4, color: C.positive }}
        >
          {t('auth.fields.emailValid')}
        </Text>
      ) : null}
    </View>
  );
}
