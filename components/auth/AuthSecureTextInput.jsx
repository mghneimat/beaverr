import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import LucideStrokeIcon from '../app/LucideStrokeIcon';
import { EYE_NODES, EYE_CLOSED_NODES } from '../app/lucidePaths';
import { useI18n } from '../../lib/i18n';
import { authInputStyle } from '../../lib/auth/authFieldStyles';
import { C, INPUT_FIELD } from '../../constants/onboarding-theme';

/**
 * Password-style input with show/hide toggle.
 */
export default function AuthSecureTextInput({
  value,
  onChangeText,
  variant = 'filled',
  placeholder,
  accessibilityLabel,
  onFocus,
  onBlur,
  style,
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const hasValue = Boolean(value);

  return (
    <View style={{ position: 'relative', width: '100%' }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        secureTextEntry={!visible || !hasValue}
        accessibilityLabel={accessibilityLabel}
        style={[
          authInputStyle(variant),
          hasValue ? { paddingRight: 44 } : null,
          style,
        ]}
      />
      {hasValue ? (
        <Pressable
          onPress={() => setVisible((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={visible
            ? t('auth.fields.hidePassword')
            : t('auth.fields.showPassword')}
          hitSlop={8}
          style={{
            position: 'absolute',
            right: 14,
            top: 0,
            height: INPUT_FIELD.minHeight,
            justifyContent: 'center',
          }}
        >
          <LucideStrokeIcon
            nodes={visible ? EYE_NODES : EYE_CLOSED_NODES}
            color={C.muted}
            size={22}
            strokeWidth={2}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
