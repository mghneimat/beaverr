import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  DASHBOARD_MOTION_EASE,
  SETTLE_FADE_IN_MS,
  SETTLE_FADE_OUT_MS,
} from '../motion';
import { useReducedMotion } from '../useReducedMotion';

/**
 * Settle crossfade for light/dark — fade out, apply palette, fade in.
 * @param {{
 *   targetMode: 'light' | 'dark',
 *   appliedMode: 'light' | 'dark',
 *   onApplyMode: (mode: 'light' | 'dark') => void,
 *   children: React.ReactNode,
 *   style?: object,
 * }} props
 */
export default function ThemeSettleTransition({
  targetMode,
  appliedMode,
  onApplyMode,
  children,
  style,
}) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const animating = useRef(false);

  useEffect(() => {
    if (targetMode === appliedMode) return;

    if (reduceMotion) {
      onApplyMode(targetMode);
      return;
    }

    if (animating.current) return;

    animating.current = true;
    opacity.value = withTiming(
      0,
      { duration: SETTLE_FADE_OUT_MS, easing: DASHBOARD_MOTION_EASE },
      (finished) => {
        if (!finished) {
          runOnJS(() => { animating.current = false; })();
          return;
        }
        runOnJS(onApplyMode)(targetMode);
        runOnJS(() => { animating.current = false; })();
        opacity.value = withTiming(1, {
          duration: SETTLE_FADE_IN_MS,
          easing: DASHBOARD_MOTION_EASE,
        });
      },
    );
  }, [targetMode, appliedMode, onApplyMode, opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
