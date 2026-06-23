import { useEffect } from 'react';
import { useIsFocused } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ENTER_DURATION_MS, ENTER_EASE, ENTER_UP } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Onboarding route-focus enter — simple fade-up, no directional navigation.
 */
export default function OnboardingScreenShell({ children, style }) {
  const reduceMotion = useReducedMotion();
  const isFocused = useIsFocused();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!isFocused) return;

    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    opacity.value = ENTER_UP.opacity;
    translateY.value = ENTER_UP.translateY;

    opacity.value = withTiming(1, { duration: ENTER_DURATION_MS, easing: ENTER_EASE });
    translateY.value = withTiming(0, { duration: ENTER_DURATION_MS, easing: ENTER_EASE });
  }, [isFocused, reduceMotion, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
