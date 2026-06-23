import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DASHBOARD_MOTION_DURATION, DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Height-based expand/collapse — animates open and closed (budget-table pattern).
 * Content height is stored in a shared value so collapse-out stays smooth across re-renders.
 */
export default function AnimatedCollapse({ visible, children, style, fallbackHeight = 72 }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const contentHeight = useSharedValue(fallbackHeight);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = visible ? 1 : 0;
      return;
    }

    progress.value = withTiming(visible ? 1 : 0, {
      duration: DASHBOARD_MOTION_DURATION,
      easing: DASHBOARD_MOTION_EASE,
    });
  }, [visible, reduceMotion, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, contentHeight.value]),
    opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.85, 1]),
    overflow: 'hidden',
  }));

  if (reduceMotion) {
    return visible ? <View style={style}>{children}</View> : null;
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      <View
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (nextHeight > 0 && Math.abs(nextHeight - contentHeight.value) > 1) {
            // Small buffer so card borders are not clipped by overflow: hidden.
            contentHeight.value = nextHeight + 4;
          }
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}
