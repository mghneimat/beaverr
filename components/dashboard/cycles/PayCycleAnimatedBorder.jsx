import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolateColor,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { C, R, SHADOW } from '../../../constants/onboarding-theme';
import {
  CYCLE_BORDER_MODE_DURATION_MS,
  CYCLE_BORDER_SETTLE_MS,
  DASHBOARD_MOTION_EASE,
} from '../../../lib/dashboardMotion';
import { useReducedMotion } from '../../../lib/useReducedMotion';
import { PAY_CYCLE_CARD_LAYOUT } from './payCycleCardLayout';
import { triggerCardSettle } from './cycleGradientBorderShared';

const BORDER_WIDTH = 2;

/**
 * Pay-cycle control card — green / red border with settle wobble on mode change.
 */
export default function PayCycleAnimatedBorder({ active = false, style, children }) {
  const reduceMotion = useReducedMotion();
  const mode = useSharedValue(active ? 1 : 0);
  const cardSettle = useSharedValue(0);
  const skipNextSettle = useRef(true);

  useEffect(() => {
    if (reduceMotion) {
      mode.value = active ? 1 : 0;
      cardSettle.value = 0;
      return;
    }

    mode.value = withTiming(active ? 1 : 0, {
      duration: CYCLE_BORDER_MODE_DURATION_MS,
      easing: DASHBOARD_MOTION_EASE,
    });

    if (skipNextSettle.current) {
      skipNextSettle.current = false;
      return;
    }

    runOnUI(triggerCardSettle)(cardSettle, CYCLE_BORDER_SETTLE_MS);
  }, [active, reduceMotion, mode, cardSettle]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${cardSettle.value}deg` }],
    borderColor: interpolateColor(
      mode.value,
      [0, 1],
      [C.heroIncomeBorder, C.heroExpenseBorder],
    ),
  }));

  const baseStyle = [
    SHADOW.card,
    {
      borderRadius: R.card,
      borderWidth: BORDER_WIDTH,
      backgroundColor: C.surface,
      overflow: 'hidden',
    },
    style ?? PAY_CYCLE_CARD_LAYOUT,
  ];

  if (reduceMotion) {
    return (
      <View
        style={[
          ...baseStyle,
          { borderColor: active ? C.heroExpenseBorder : C.heroIncomeBorder },
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <Animated.View style={[...baseStyle, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export { PAY_CYCLE_CARD_LAYOUT } from './payCycleCardLayout';
