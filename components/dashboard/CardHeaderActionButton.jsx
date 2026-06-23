import { Pressable, Platform, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../constants/onboarding-theme';
import ExpandCollapseIcon from '../onboarding/ExpandCollapseIcon';

/** Shared min width for Export, Expand all, Add, and other card header controls. */
export const CARD_HEADER_ACTION_MIN_WIDTH = 140;

const CARD_HEADER_TOGGLE_SIZE = 18;

/** Shared chevron slot — dropdown menus (Export, profile). */
export function CardHeaderChevron({
  expanded = false,
  color = C.primary,
  active = false,
}) {
  const chevronColor = active ? C.accent : color;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: CARD_HEADER_TOGGLE_SIZE,
        height: CARD_HEADER_TOGGLE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{
        fontSize: 10,
        fontWeight: '700',
        lineHeight: 12,
        textAlign: 'center',
        color: chevronColor,
        includeFontPadding: false,
        transform: [{ rotate: expanded ? '180deg' : '0deg' }],
      }}>
        ▼
      </Text>
    </View>
  );
}

/** Animated + / − for expand/collapse accordions and breakdown rows. */
export function CardHeaderExpandIcon(props) {
  return (
    <ExpandCollapseIcon
      size={CARD_HEADER_TOGGLE_SIZE}
      compact
      {...props}
    />
  );
}

export function cardHeaderActionStyle({ pressed, hovered, active = false }) {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: CARD_HEADER_ACTION_MIN_WIDTH,
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: R.pill,
    backgroundColor: active || pressed
      ? C.overlayPressed
      : hovered
        ? C.overlayHover
        : 'transparent',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  };
}

export function cardHeaderActionLabelStyle(active = false) {
  return {
    ...T.btnPrimary,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    color: active ? C.accent : C.primary,
  };
}

/**
 * Pill header control — matches Export / Expand all sizing and hover treatment.
 */
export default function CardHeaderActionButton({
  label,
  onPress,
  accessibilityLabel,
  accessibilityState,
  trailingIcon = null,
  active = false,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={accessibilityState}
      style={({ pressed, hovered }) => [cardHeaderActionStyle({ pressed, hovered, active }), style]}
    >
      <Text style={cardHeaderActionLabelStyle(active)} numberOfLines={1}>
        {label}
      </Text>
      {trailingIcon}
    </Pressable>
  );
}
