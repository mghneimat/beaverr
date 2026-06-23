import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  cancelAnimation,
  interpolateColor,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { C } from '../../../constants/onboarding-theme';
import {
  CYCLE_BORDER_MODE_DURATION_MS,
  CYCLE_BORDER_SETTLE_DEG,
  CYCLE_BORDER_SETTLE_MS,
  CYCLE_BORDER_SPIN_DURATION_MS,
  DASHBOARD_MOTION_EASE,
} from '../../../lib/dashboardMotion';
import { useReducedMotion } from '../../../lib/useReducedMotion';
import {
  startContinuousSpin,
  triggerCardSettle,
  triggerSettleSpin,
} from './cycleGradientBorderShared';

/**
 * Shared spin + mode animation for pay-cycle card border and CTA button ring.
 */
export function useCycleGradientBorder(active) {
  const reduceMotion = useReducedMotion();
  const mode = useSharedValue(active ? 1 : 0);
  const rotation = useSharedValue(0);
  const cardSettle = useSharedValue(0);
  const spinEnabled = Platform.OS === 'web' && !reduceMotion;
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

    if (spinEnabled) {
      runOnUI(triggerSettleSpin)(
        rotation,
        CYCLE_BORDER_SETTLE_DEG,
        CYCLE_BORDER_SETTLE_MS,
        CYCLE_BORDER_SPIN_DURATION_MS,
      );
    }
  }, [active, reduceMotion, spinEnabled, mode, rotation, cardSettle]);

  useEffect(() => {
    if (!spinEnabled) {
      cancelAnimation(rotation);
      rotation.value = 0;
      return;
    }
    runOnUI(startContinuousSpin)(rotation, CYCLE_BORDER_SPIN_DURATION_MS);
  }, [spinEnabled, rotation]);

  const idleGradientStyle = useAnimatedStyle(() => ({
    opacity: 1 - mode.value,
  }));

  const activeGradientStyle = useAnimatedStyle(() => ({
    opacity: mode.value,
  }));

  const cardSettleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${cardSettle.value}deg` }],
  }));

  const nativeBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      mode.value,
      [0, 1],
      [C.heroIncomeBorder, C.heroExpenseBorder],
    ),
    backgroundColor: interpolateColor(
      mode.value,
      [0, 1],
      [C.heroIncomeBg, C.heroExpenseBg],
    ),
  }));

  const nativeBorderRingStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      mode.value,
      [0, 1],
      [C.heroIncomeBorder, C.heroExpenseBorder],
    ),
  }));

  return {
    spinEnabled,
    reduceMotion,
    rotation,
    idleGradientStyle,
    activeGradientStyle,
    cardSettleStyle,
    nativeBorderStyle,
    nativeBorderRingStyle,
  };
}
