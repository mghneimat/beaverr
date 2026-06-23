import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Accordion panel — animates to measured content height (expand + collapse).
 */
export default function AnimatedAccordionBody({
  open,
  children,
  duration = 280,
}) {
  const reduceMotion = useReducedMotion();
  const contentHeight = useSharedValue(0);
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (reduceMotion) {
      setMounted(open);
      progress.value = open ? 1 : 0;
      return;
    }

    if (open) {
      setMounted(true);
      if (contentHeight.value > 0) {
        progress.value = withTiming(1, {
          duration,
          easing: Easing.out(Easing.cubic),
        });
      }
      return;
    }

    progress.value = withTiming(0, {
      duration: Math.round(duration * 0.85),
      easing: Easing.in(Easing.cubic),
    });
    const collapseMs = Math.round(duration * 0.85);
    const timer = setTimeout(() => {
      setMounted(false);
      contentHeight.value = 0;
      progress.value = 0;
    }, collapseMs + 20);
    return () => clearTimeout(timer);
  }, [open, reduceMotion, duration, progress, contentHeight]);

  const panelStyle = useAnimatedStyle(() => ({
    height: contentHeight.value * progress.value,
    opacity: interpolate(progress.value, [0, 0.25, 1], [0, 0.9, 1]),
  }));

  const handleLayout = (event) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight <= 0) return;

    contentHeight.value = nextHeight;

    if (open && progress.value < 1) {
      progress.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    }
  };

  if (reduceMotion) {
    return open ? <View>{children}</View> : null;
  }

  if (!mounted) return null;

  return (
    <Animated.View style={[{ overflow: 'hidden' }, panelStyle]}>
      <View onLayout={handleLayout}>
        {children}
      </View>
    </Animated.View>
  );
}
