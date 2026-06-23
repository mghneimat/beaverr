import { useEffect, useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { DASHBOARD_MOTION_DURATION, ENTER_EASE } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Animated row that fades + slides in on mount and out when `visible` becomes false.
 */
export default function AnimatedRow({
  visible,
  children,
  onAnimationEnd,
  duration = DASHBOARD_MOTION_DURATION,
  style,
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(visible ? 1 : 0);
  const onAnimationEndRef = useRef(onAnimationEnd);
  onAnimationEndRef.current = onAnimationEnd;

  const notifyEnd = () => {
    onAnimationEndRef.current?.();
  };

  useEffect(() => {
    if (reduceMotion) {
      progress.value = visible ? 1 : 0;
      if (!visible) notifyEnd();
      return;
    }

    progress.value = withTiming(visible ? 1 : 0, { duration, easing: ENTER_EASE }, (finished) => {
      if (finished && !visible) {
        runOnJS(notifyEnd)();
      }
    });
  }, [visible, reduceMotion, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: (1 - progress.value) * 20 }],
  }));

  if (reduceMotion && !visible) return null;

  return (
    <Animated.View
      style={[
        animatedStyle,
        { marginBottom: 10 },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
