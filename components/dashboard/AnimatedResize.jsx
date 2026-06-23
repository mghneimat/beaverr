import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DASHBOARD_MOTION_DURATION, DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Animates container height when measured content grows or shrinks.
 */
export default function AnimatedResize({ children, style, fallbackHeight = 72 }) {
  const reduceMotion = useReducedMotion();
  const height = useSharedValue(fallbackHeight);
  const skipAnimation = useRef(true);

  const onLayout = useCallback((event) => {
    const next = event.nativeEvent.layout.height;
    if (next <= 0) return;

    if (reduceMotion || skipAnimation.current) {
      skipAnimation.current = false;
      height.value = next;
      return;
    }

    if (Math.abs(next - height.value) > 1) {
      height.value = withTiming(next, {
        duration: DASHBOARD_MOTION_DURATION,
        easing: DASHBOARD_MOTION_EASE,
      });
    }
  }, [height, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }));

  if (reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      <View onLayout={onLayout}>
        {children}
      </View>
    </Animated.View>
  );
}
