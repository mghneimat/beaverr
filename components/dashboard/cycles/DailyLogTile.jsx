import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { LockIcon } from '../../app/AppNavIcons';
import { C, R, SHADOW, T, tabularNums } from '../../../constants/onboarding-theme';
import { CYCLE_CONTROL_PILL_BUTTON } from './cycleControlPill';
import { CycleControlPlusIcon } from './CycleControlButtonIcon';
import { formatCurrency } from '../../../lib/finance';

const TILE_SHELL_STYLE = {
  ...SHADOW.card,
};

const TILE_INNER = {
  flex: 1,
  padding: 12,
  flexDirection: 'column',
};

function tileSurfaceState(pressed, hovered) {
  if (pressed) return C.surfaceTint;
  if (hovered) return C.surfaceTint;
  return C.surface;
}

function LogSpendButtonContent({ label, disabled = false }) {
  const color = disabled ? C.muted : C.primary;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <CycleControlPlusIcon color={color} />
      <Text style={{ fontSize: 14, fontWeight: '600', lineHeight: 16, color }}>
        {label}
      </Text>
    </View>
  );
}

export default function DailyLogTile({
  title,
  helper,
  spentToday = 0,
  currency,
  ctaLabel,
  ctaA11y,
  lockedA11y,
  onPress,
  disabled = false,
  style,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const showAmount = !disabled && spentToday > 0;

  return (
    <View
      style={[
        TILE_SHELL_STYLE,
        {
          borderWidth: 2,
          borderColor: C.border,
          borderRadius: R.card,
          backgroundColor: C.surface,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View style={[TILE_INNER, disabled ? { opacity: 0.72 } : null]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary, flex: 1 }} numberOfLines={2}>
            {title}
          </Text>
          {disabled ? (
            <View accessibilityLabel={lockedA11y} accessibilityRole="image">
              <LockIcon color={C.muted} size={16} />
            </View>
          ) : null}
        </View>

        <Text
          style={{
            ...T.caption,
            color: C.muted,
            marginTop: 6,
            flex: showAmount ? 0 : 1,
          }}
          numberOfLines={4}
        >
          {helper}
        </Text>

        {showAmount ? (
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: C.primary,
              marginTop: 8,
              ...tabularNums,
            }}
            numberOfLines={1}
          >
            {formatCurrency(spentToday, currency)}
          </Text>
        ) : null}

        {disabled ? (
          <View
            accessibilityRole="text"
            accessibilityLabel={lockedA11y}
            style={{
              marginTop: 'auto',
              ...CYCLE_CONTROL_PILL_BUTTON,
              borderWidth: 1.5,
              borderColor: C.border,
              backgroundColor: C.pillUnselectedBg,
              opacity: 0.55,
            }}
          >
            <LogSpendButtonContent label={ctaLabel} disabled />
          </View>
        ) : (
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={ctaA11y}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={{
              marginTop: 'auto',
              ...CYCLE_CONTROL_PILL_BUTTON,
              borderWidth: 1.5,
              borderColor: C.border,
              backgroundColor: tileSurfaceState(pressed, hovered),
              ...SHADOW.button,
            }}
          >
            <LogSpendButtonContent label={ctaLabel} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
