import { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ENTER_DURATION_MS, ENTER_EASE, ENTER_TRANSLATE_Y } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

function AnimatedEnterView({
  children,
  animationKey,
  duration,
  translateY,
  style,
  skipInitial,
}) {
  const skipNext = useRef(skipInitial);
  const opacity = useSharedValue(skipInitial ? 1 : 0);
  const translate = useSharedValue(skipInitial ? 0 : translateY);

  useEffect(() => {
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
  }, [animationKey, duration, translateY, opacity, translate]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

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

  if (Platform.OS === 'web' || reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  return (
    <AnimatedEnterView
      animationKey={animationKey}
      duration={duration}
      translateY={translateY}
      style={style}
      skipInitial={skipInitial}
    >
      {children}
    </AnimatedEnterView>
  );
}
