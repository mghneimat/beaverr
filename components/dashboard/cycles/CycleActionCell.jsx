import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { LockIcon } from '../../app/AppNavIcons';
import { C, R, SHADOW, T, tabularNums } from '../../../constants/onboarding-theme';
import { washBg } from '../../onboarding/pressableFeedback';
import { formatCurrency } from '../../../lib/finance';

const CYCLE_END_RED = '#C02B33';
const CYCLE_START_GREEN = '#317325';

/**
 * Single action tile in the 2×2 manage-period grid — icon, title, subtitle; whole cell is tappable.
 */
export default function CycleActionCell({
  title,
  subtitle,
  icon,
  onPress,
  disabled = false,
  lockedA11y,
  accessibilityLabel,
  variant = 'default',
  style,
  badgeLabel,
  footerText,
  footerAmount,
  footerCurrency,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const titleColor = variant === 'destructive'
    ? CYCLE_END_RED
    : variant === 'positive'
      ? CYCLE_START_GREEN
      : disabled
        ? C.muted
        : C.primary;

  const borderColor = variant === 'destructive'
    ? C.heroExpenseBorder
    : variant === 'positive'
      ? C.heroIncomeBorder
      : C.border;

  const surface = disabled
    ? C.pillUnselectedBg
    : washBg({ pressed, hovered }, C.surface);

  const content = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 8 }}>
        <View style={{ opacity: disabled ? 0.55 : 1 }}>{icon}</View>
        {disabled ? (
          <View accessibilityLabel={lockedA11y} accessibilityRole="image">
            <LockIcon color={C.muted} size={16} />
          </View>
        ) : null}
        {!disabled && badgeLabel ? (
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: R.pill,
              backgroundColor: C.surfaceTint,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: '700', color: C.muted }}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>

      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: titleColor,
          marginTop: 8,
        }}
        numberOfLines={2}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={{ ...T.caption, color: C.muted, marginTop: 4, flex: 1 }}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      ) : null}

      {typeof footerAmount === 'number' ? (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: C.primary,
            marginTop: 6,
            ...tabularNums,
          }}
          numberOfLines={1}
        >
          {formatCurrency(footerAmount, footerCurrency)}
        </Text>
      ) : footerText ? (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: C.primary,
            marginTop: 6,
            ...tabularNums,
          }}
          numberOfLines={1}
        >
          {footerText}
        </Text>
      ) : null}
    </>
  );

  const shellStyle = {
    flex: 1,
    minWidth: 0,
    minHeight: 108,
    padding: 14,
    borderRadius: R.card,
    borderWidth: 1.5,
    borderColor,
    backgroundColor: surface,
    alignItems: 'flex-start',
    ...SHADOW.card,
    ...(disabled ? { opacity: 0.72 } : {}),
  };

  if (disabled || !onPress) {
    return (
      <View
        style={[shellStyle, style]}
        accessibilityRole="text"
        accessibilityLabel={lockedA11y || accessibilityLabel}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[shellStyle, style]}
    >
      {content}
    </Pressable>
  );
}
