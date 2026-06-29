import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  DASHBOARD_MOTION_EASE,
  PAGE_CONTENT_REVEAL_MS,
} from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * One-way fade-in when content replaces a loading skeleton — no fade-out blink.
 */
export default function ContentReveal({ children, style }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = 0;
    opacity.value = withTiming(1, {
      duration: PAGE_CONTENT_REVEAL_MS,
      easing: DASHBOARD_MOTION_EASE,
    });
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (reduceMotion) {
    return children;
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
