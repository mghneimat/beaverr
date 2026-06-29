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

const RADIO_SIZE = 20;
const RADIO_INNER = 8;

/**
 * Radio-style strategy card — left selector, responsive flow pills.
 * Selected state uses continue-button accent blue (C.accent).
 * @param {{
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
      duration: 280,
      easing: DASHBOARD_MOTION_EASE,
    });
  }, [reduceMotion, selectProgress, selected]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(selectProgress.value, [0, 1], [1, 1.002]) }],
  }));

  const hoverProps = Platform.OS === 'web'
    ? { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) }
    : {};

  const borderColor = selected
    ? C.accent
    : hovered
      ? C.accent
      : C.border;

  const backgroundColor = selected
    ? C.infoBg
    : hovered
      ? C.overlayHover
      : C.surface;

  return (
    <Animated.View style={[{ width: '100%' }, cardAnimStyle]}>
      <Pressable
        onPress={onPress}
        disabled={selected}
        accessibilityRole="radio"
        accessibilityLabel={selectA11yLabel || label}
        accessibilityState={{ selected, disabled: selected }}
        {...hoverProps}
        style={({ pressed }) => ({
          width: '100%',
          paddingVertical: OPTION_CARD.paddingVertical,
          paddingHorizontal: OPTION_CARD.paddingHorizontal,
          borderRadius: R.input,
          borderWidth: selected ? 2 : 1,
          borderColor,
          backgroundColor: pressed && !selected ? C.bg : backgroundColor,
          ...(Platform.OS === 'web' && !selected ? { cursor: 'pointer' } : {}),
          ...(Platform.OS === 'web'
            ? { transition: 'background-color 0.22s ease, border-color 0.22s ease', maxWidth: '100%' }
            : {}),
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View
            style={{
              width: RADIO_SIZE,
              height: RADIO_SIZE,
              borderRadius: RADIO_SIZE / 2,
              borderWidth: selected ? 0 : 1.5,
              borderColor: selected ? 'transparent' : C.border,
              backgroundColor: selected ? C.accent : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
              flexShrink: 0,
            }}
          >
            {selected ? (
              <View
                style={{
                  width: RADIO_INNER,
                  height: RADIO_INNER,
                  borderRadius: RADIO_INNER / 2,
                  backgroundColor: C.surface,
                }}
              />
            ) : null}
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                ...T.cardTitle,
                fontSize: 15,
                color: C.text,
                fontWeight: '400',
                lineHeight: OPTION_CARD.labelLineHeight,
              }}
            >
              {label}
            </Text>

            <Text
              style={{
                ...T.caption,
                color: C.muted,
                marginTop: OPTION_CARD.subtitleMarginTop + 2,
                lineHeight: OPTION_CARD.subtitleLineHeight + 2,
                fontSize: 13,
              }}
            >
              {body}
            </Text>

            <StrategyFlowPills steps={flowSteps} />

            <AnimatedSlideIn visible={selected && !!detailLine}>
              <Text style={{ ...T.caption, color: C.muted, marginTop: 8, lineHeight: 18 }}>
                {detailLine}
              </Text>
            </AnimatedSlideIn>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
