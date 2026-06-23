import { useState } from 'react';
import { Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T, SHADOW } from '../../constants/onboarding-theme';
import { washBg } from '../onboarding/pressableFeedback';

/**
 * Pill-shaped primary CTA — gluestack Text + Pressable for hover/press control.
 */
export function PrimaryButton({
  children,
  onPress,
  disabled = false,
  fullWidth = true,
  variant = 'primary',
  style,
  textStyle,
  numberOfLines,
  accessibilityState,
  accessibilityLabel,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isOutline = variant === 'outline';
  const bgColor = disabled
    ? C.disabled
    : isOutline
      ? washBg({ pressed, hovered }, C.surface)
      : pressed
        ? C.pillSelectedPressed
        : C.pillSelectedBg;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      accessibilityState={accessibilityState}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        {
          flex: fullWidth ? 1 : undefined,
          paddingVertical: 16,
          paddingHorizontal: 28,
          borderRadius: R.button,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hovered && !disabled && !isOutline ? 0.94 : 1,
          borderWidth: isOutline ? 1.5 : 0,
          borderColor: isOutline ? C.border : 'transparent',
          ...(!disabled && !isOutline ? SHADOW.button : {}),
        },
        style,
      ]}
    >
      <Text
        numberOfLines={numberOfLines}
        style={[
          isOutline
            ? { ...T.btnPrimary, color: C.primary }
            : { ...T.btnPrimary, color: C.pillSelectedText },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export default PrimaryButton;
