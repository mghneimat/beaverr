import { useCallback, useEffect, useRef } from 'react';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  DASHBOARD_MOTION_EASE,
  SETTLE_FADE_IN_MS,
  SETTLE_FADE_OUT_MS,
  SETTLE_FADE_Y,
} from './dashboardMotion';
import { useReducedMotion } from './useReducedMotion';

/**
 * Two-phase settle crossfade: fade out → optional midpoint callback → fade in.
 * Skips animation on first mount; respects reduced motion.
 *
 * @param {string|number} animationKey — when this changes, the crossfade replays
 * @param {{ slide?: boolean, skipInitial?: boolean, onMidpoint?: () => void }} [options]
 */
export function useSettleCrossfade(animationKey, options = {}) {
  const { slide = true, skipInitial = true, onMidpoint } = options;
  const reduceMotion = useReducedMotion();
  const skipNext = useRef(skipInitial);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const onMidpointRef = useRef(onMidpoint);
  onMidpointRef.current = onMidpoint;

  const runMidpoint = useCallback(() => {
    onMidpointRef.current?.();
  }, []);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      onMidpointRef.current?.();
      return;
    }

    opacity.value = withTiming(
      0,
      { duration: SETTLE_FADE_OUT_MS, easing: DASHBOARD_MOTION_EASE },
      (finished) => {
        if (!finished) return;
        if (onMidpointRef.current) {
          runOnJS(runMidpoint)();
        }
        translateY.value = slide ? SETTLE_FADE_Y : 0;
        opacity.value = 0;
        opacity.value = withTiming(1, {
          duration: SETTLE_FADE_IN_MS,
          easing: DASHBOARD_MOTION_EASE,
        });
        if (slide) {
          translateY.value = withTiming(0, {
            duration: SETTLE_FADE_IN_MS,
            easing: DASHBOARD_MOTION_EASE,
          });
        }
      },
    );
  }, [animationKey, reduceMotion, runMidpoint, opacity, slide, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: slide ? [{ translateY: translateY.value }] : [],
  }));

  return { animatedStyle, reduceMotion };
}
