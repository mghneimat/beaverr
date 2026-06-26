import { useState } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import FieldError from '../onboarding/FieldError';
import AuthFieldCircleCheck from './AuthFieldCircleCheck';
import { useI18n } from '../../lib/i18n';
import { authInputStyle } from '../../lib/auth/authFieldStyles';
import { C, T, INPUT_FIELD } from '../../constants/onboarding-theme';

/** @typedef {'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'checkFailed'} UsernameStatus */

/**
 * Username field with inline availability indicator.
 */
export default function AuthUsernameInput({ value, onChangeText, status, editable = true }) {
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);
  const trimmed = value.trim();
  const showTrailing = editable && (status === 'checking' || status === 'available');

  let hint = null;
  let hintIsError = false;

  if (editable && trimmed) {
    if (status === 'checking') hint = t('auth.fields.usernameChecking');
    if (status === 'available') hint = t('auth.fields.usernameAvailable');
    if (status === 'taken') {
      hint = t('auth.errors.usernameTaken');
      hintIsError = true;
    }
    if (status === 'invalid') {
      hint = t('auth.errors.usernameInvalid');
      hintIsError = true;
    }
    if (status === 'checkFailed') {
      hint = t('auth.errors.usernameCheckFailed');
      hintIsError = true;
    }
  }

  return (
    <View style={{ width: '100%' }}>
      <View style={{ position: 'relative', width: '100%' }}>
        <TextInput
          value={value}
          onChangeText={(next) => onChangeText(next.replace(/\s/g, ''))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          placeholder={t('auth.fields.usernamePlaceholder')}
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t('auth.fields.username')}
          style={[
            authInputStyle('filled'),
            showTrailing ? { paddingRight: 44 } : null,
            !editable ? { opacity: 0.92 } : null,
          ]}
        />
        {status === 'checking' ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: 14,
              top: 0,
              height: INPUT_FIELD.minHeight,
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="small" color={C.muted} />
          </View>
        ) : null}
        {status === 'available' ? (
          <View
            pointerEvents="none"
            accessibilityLabel={t('auth.fields.usernameAvailable')}
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

      {hint && hintIsError ? <FieldError message={hint} /> : null}
      {hint && !hintIsError && focused ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            ...T.hint,
            marginTop: 4,
            color: status === 'available' ? C.positive : C.muted,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
