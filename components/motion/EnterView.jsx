import { useEffect, useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ENTER_DURATION_MS, ENTER_EASE, ENTER_TRANSLATE_Y } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Reanimated fade-in + slide-up wrapper.
 * Re-triggers when `animationKey` changes (step transitions, route mounts).
 * Use `skipInitial` when a parent shell already played the route enter.
 */
export default function EnterView({
  children,
  animationKey,
  duration = ENTER_DURATION_MS,
  translateY = ENTER_TRANSLATE_Y,
  style,
  skipInitial = false,
}) {
  const reduceMotion = useReducedMotion();
  const skipNext = useRef(skipInitial);
  const opacity = useSharedValue(reduceMotion || skipInitial ? 1 : 0);
  const translate = useSharedValue(reduceMotion || skipInitial ? 0 : translateY);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translate.value = 0;
      return;
    }

    if (skipNext.current) {
      skipNext.current = false;
      opacity.value = 1;
      translate.value = 0;
      return;
    }

    opacity.value = 0;
    translate.value = translateY;

    opacity.value = withTiming(1, { duration, easing: ENTER_EASE });
    translate.value = withTiming(0, { duration, easing: ENTER_EASE });
  }, [animationKey, duration, translateY, reduceMotion, opacity, translate]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  if (reduceMotion) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
