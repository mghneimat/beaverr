import { useEffect } from 'react';
import { useIsFocused, useSegments } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { consumeScreenTransitionDirection } from '../../lib/screenTransition';
import {
  DASHBOARD_MOTION_EASE,
  DASHBOARD_ENTER,
  SETTLE_FADE_IN_MS,
} from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useTheme } from '../../lib/theme';
import { C } from '../../constants/onboarding-theme';
import SettleCrossfade from '../ui/SettleCrossfade';

/**
 * Universal route-focus enter shell for app tabs and dashboard.
 * Optionally wraps children in SettleCrossfade when `settleKey` is provided.
 * @param {'dashboard' | 'tab'} variant
 */
export default function AppScreenShell({
  children,
  variant = 'tab',
  settleKey,
  style,
}) {
  useTheme();
  const reduceMotion = useReducedMotion();
  const isFocused = useIsFocused();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  const inEditModal = segments.includes('edit');
  const isTabSurface = variant === 'dashboard'
    ? currentRoute === 'dashboard' && !inEditModal
    : !inEditModal && currentRoute !== 'dashboard';

  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!isFocused || !isTabSurface) return;

    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      translateX.value = 0;
      consumeScreenTransitionDirection();
      return;
    }

    const direction = consumeScreenTransitionDirection();
    const enter = DASHBOARD_ENTER[direction] || DASHBOARD_ENTER.none;

    opacity.value = enter.opacity;
    translateY.value = enter.translateY;
    translateX.value = enter.translateX;

    opacity.value = withTiming(1, { duration: SETTLE_FADE_IN_MS, easing: DASHBOARD_MOTION_EASE });
    translateY.value = withTiming(0, { duration: SETTLE_FADE_IN_MS, easing: DASHBOARD_MOTION_EASE });
    translateX.value = withTiming(0, { duration: SETTLE_FADE_IN_MS, easing: DASHBOARD_MOTION_EASE });
  }, [isFocused, isTabSurface, currentRoute, reduceMotion, opacity, translateY, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  const inner = settleKey != null ? (
    <SettleCrossfade animationKey={settleKey} style={{ flex: 1 }}>
      {children}
    </SettleCrossfade>
  ) : (
    children
  );

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: C.bg }, style, animatedStyle]}>
      {inner}
    </Animated.View>
  );
}
