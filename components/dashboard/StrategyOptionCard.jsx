import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { C, OPTION_CARD, R, T } from '../../constants/onboarding-theme';
import { DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import AnimatedSlideIn from '../onboarding/AnimatedSlideIn';
import StrategyFlowPills from './StrategyFlowPills';

const ICON_BOX = 40;
const RADIO_SIZE = 22;
const ICON_WELL_BG = C.bg;
const ICON_WELL_BORDER = C.border;

/**
 * Radio-style strategy card with icon box, flow pills, and trailing selector.
 * @param {{
 *   icon?: string,
 *   iconBg?: string,
 *   iconBorder?: string,
 *   label: string,
 *   body: string,
 *   flowSteps?: Array<{ kind: 'event'|'jar'|'outcome', label: string }>,
 *   detailLine?: string|null,
 *   selected: boolean,
 *   onPress: () => void,
 *   selectA11yLabel?: string,
 * }} props
 */
export default function StrategyOptionCard({
  icon,
  iconBg = ICON_WELL_BG,
  iconBorder = ICON_WELL_BORDER,
  label,
  body,
  flowSteps,
  detailLine,
  selected,
  onPress,
  selectA11yLabel,
}) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const selectProgress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      selectProgress.value = selected ? 1 : 0;
      return;
    }
    selectProgress.value = withTiming(selected ? 1 : 0, {
      duration: 320,
      easing: DASHBOARD_MOTION_EASE,
    });
  }, [reduceMotion, selectProgress, selected]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(selectProgress.value, [0, 1], [1, 1.004]) }],
  }));

  const hoverProps = Platform.OS === 'web'
    ? { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) }
    : {};

  return (
    <Animated.View style={[{ marginBottom: 10 }, cardAnimStyle]}>
      <Pressable
        onPress={onPress}
        disabled={selected}
        accessibilityRole="radio"
        accessibilityLabel={selectA11yLabel || label}
        accessibilityState={{ selected, disabled: selected }}
        {...hoverProps}
        style={({ pressed }) => ({
          paddingVertical: OPTION_CARD.paddingVertical,
          paddingHorizontal: OPTION_CARD.paddingHorizontal,
          borderRadius: R.input,
          borderWidth: 1.5,
          borderColor: selected
            ? C.primary
            : hovered
              ? C.accent
              : C.border,
          backgroundColor: selected
            ? C.navSelectedBg
            : hovered
              ? C.overlayHover
              : pressed
                ? C.bg
                : C.surface,
          ...(Platform.OS === 'web' && !selected ? { cursor: 'pointer' } : {}),
          ...(Platform.OS === 'web'
            ? { transition: 'background-color 0.22s ease, border-color 0.22s ease' }
            : {}),
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          {icon ? (
            <View
              style={{
                width: ICON_BOX,
                height: ICON_BOX,
                borderRadius: ICON_BOX / 2,
                backgroundColor: iconBg,
                borderWidth: 1,
                borderColor: iconBorder,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Text
                style={{
                  width: ICON_BOX,
                  fontSize: 20,
                  lineHeight: ICON_BOX,
                  textAlign: 'center',
                  ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
                }}
              >
                {icon}
              </Text>
            </View>
          ) : null}

          <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
            <Text
              style={{
                ...T.cardTitle,
                fontSize: 15,
                color: selected ? C.primary : C.text,
                fontWeight: '600',
                lineHeight: OPTION_CARD.labelLineHeight,
              }}
            >
              {label}
            </Text>
            <Text style={{ ...T.caption, color: C.muted, marginTop: OPTION_CARD.subtitleMarginTop, lineHeight: OPTION_CARD.subtitleLineHeight }}>
              {body}
            </Text>
            <StrategyFlowPills steps={flowSteps} />
            <AnimatedSlideIn visible={selected && !!detailLine}>
              <Text style={{ ...T.caption, color: C.muted, marginTop: 8, lineHeight: 18 }}>
                {detailLine}
              </Text>
            </AnimatedSlideIn>
          </View>

          <View
            style={{
              width: RADIO_SIZE,
              height: RADIO_SIZE,
              borderRadius: RADIO_SIZE / 2,
              borderWidth: selected ? 0 : 1.5,
              borderColor: C.border,
              backgroundColor: selected ? C.chipSelectedBg : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
              flexShrink: 0,
            }}
          >
            {selected ? (
              <Text style={{ color: C.chipSelectedText, fontSize: 12, lineHeight: 14, fontWeight: '700' }}>
                ✓
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
