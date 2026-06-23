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
import AnimatedCollapse from './AnimatedCollapse';

const SLIDE_PX = 10;
const SCALE_MIN = 0.98;

/**
 * Top banner shell — height collapse plus slide/scale enter and exit.
 * @param {{
 *   visible: boolean,
 *   children: import('react').ReactNode,
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>,
 *   fallbackHeight?: number,
 * }} props
 */
export default function AnimatedBannerShell({
  visible,
  children,
  style,
  fallbackHeight = 52,
}) {
  const reduceMotion = useReducedMotion();
  const motion = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      motion.value = visible ? 1 : 0;
      return;
    }

    motion.value = withTiming(visible ? 1 : 0, {
      duration: DASHBOARD_MOTION_DURATION,
      easing: DASHBOARD_MOTION_EASE,
    });
  }, [visible, reduceMotion, motion]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(motion.value, [0, 1], [-SLIDE_PX, 0]) },
      { scale: interpolate(motion.value, [0, 1], [SCALE_MIN, 1]) },
    ],
  }));

  return (
    <AnimatedCollapse visible={visible} fallbackHeight={fallbackHeight} style={style}>
      {reduceMotion ? (
        <View>{children}</View>
      ) : (
        <Animated.View style={contentStyle}>{children}</Animated.View>
      )}
    </AnimatedCollapse>
  );
}
