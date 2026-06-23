import { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DASHBOARD_MOTION_DURATION, ENTER_EASE } from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/** Upper bound while content height is measured — long forms exceed 2000px. */
const FALLBACK_EXPANDED_MAX = 12000;

/**
 * Animated wrapper that fades + slides its children in/out.
 * Uses maxHeight collapse so hidden children take zero layout space.
 */
export default function AnimatedSlideIn({
  visible,
  children,
  duration = DASHBOARD_MOTION_DURATION,
  spacingTop = 0,
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(visible ? 1 : 0);
  const [overflowHidden, setOverflowHidden] = useState(!visible);
  const [contentHeight, setContentHeight] = useState(0);

  const handleContentLayout = useCallback((event) => {
    const next = Math.ceil(event.nativeEvent.layout.height);
    if (next > 0) {
      setContentHeight((prev) => (prev === next ? prev : next));
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setContentHeight(0);
    }
  }, [visible]);

  useEffect(() => {
    if (reduceMotion) {
      setOverflowHidden(!visible);
      progress.value = visible ? 1 : 0;
      return;
    }

    if (visible) {
      const timer = setTimeout(() => setOverflowHidden(false), duration);
      progress.value = withTiming(1, { duration, easing: ENTER_EASE });
      return () => clearTimeout(timer);
    }

    setOverflowHidden(true);
    progress.value = withTiming(0, { duration, easing: ENTER_EASE });
  }, [visible, reduceMotion, duration, progress]);

  const expandedMax = contentHeight > 0 ? contentHeight : FALLBACK_EXPANDED_MAX;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    maxHeight: progress.value * expandedMax + (1 - progress.value) * 0,
  }));

  const spacerStyle = useAnimatedStyle(() => ({
    height: spacingTop > 0 ? progress.value * spacingTop : 0,
  }));

  if (reduceMotion) {
    return visible ? (
      <>
        {spacingTop > 0 ? <View style={{ height: spacingTop }} /> : null}
        {children}
      </>
    ) : null;
  }

  return (
    <Animated.View
      style={[
        animatedStyle,
        { overflow: overflowHidden ? 'hidden' : 'visible' },
      ]}
    >
      {spacingTop > 0 ? <Animated.View style={spacerStyle} /> : null}
      <View onLayout={handleContentLayout} collapsable={false}>
        {children}
      </View>
    </Animated.View>
  );
}
