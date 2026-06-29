import { useState } from 'react';
import { Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../constants/onboarding-theme';

/**
 * Secondary pill button — white fill, border (Balshet filter-button style).
 * @param {boolean} [destructive=false] — red border + label (wizard Cancel actions)
 */
export function OutlineButton({
  children,
  onPress,
  disabled = false,
  destructive = false,
  accessibilityLabel,
  style,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const borderColor = destructive ? C.danger : C.border;
  const labelColor = destructive ? C.danger : C.primary;
  const backgroundColor = destructive
    ? (pressed ? C.dangerBg : hovered ? C.dangerBg : C.surface)
    : (pressed ? C.surfaceTint : hovered ? C.surface : C.surface);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        {
          minHeight: 44,
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: R.button,
          borderWidth: 1.5,
          borderColor,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text style={{ ...T.btnPrimary, color: labelColor }}>
        {children}
      </Text>
    </Pressable>
  );
}

export default OutlineButton;
