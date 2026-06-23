import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  DASHBOARD_MOTION_EASE,
  SETTLE_FADE_IN_MS,
  SETTLE_FADE_OUT_MS,
  SETTLE_FADE_Y,
} from '../../lib/motion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Wraps children in a settle crossfade when `animationKey` changes.
 * Fades out old content, swaps, then fades in — used for frequency toggles and page reveal.
 */
export default function SettleCrossfade({
  animationKey,
  children,
  style,
  slide = true,
  skipInitial = true,
}) {
  const reduceMotion = useReducedMotion();
  const skipNext = useRef(skipInitial);
  const pendingChildren = useRef(children);
  const [visibleChildren, setVisibleChildren] = useState(children);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const isAnimating = useRef(false);

  pendingChildren.current = children;

  useEffect(() => {
    if (!isAnimating.current && skipNext.current === false) {
      setVisibleChildren(children);
    }
  }, [children]);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      setVisibleChildren(children);
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    if (reduceMotion) {
      setVisibleChildren(children);
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    isAnimating.current = true;
    opacity.value = withTiming(
      0,
      { duration: SETTLE_FADE_OUT_MS, easing: DASHBOARD_MOTION_EASE },
      (finished) => {
        if (!finished) return;
        runOnJS(setVisibleChildren)(pendingChildren.current);
        runOnJS(() => { isAnimating.current = false; })();
        translateY.value = slide ? SETTLE_FADE_Y : 0;
        opacity.value = 0;
        opacity.value = withTiming(1, {
          duration: SETTLE_FADE_IN_MS,
          easing: DASHBOARD_MOTION_EASE,
        });
        if (slide) {
          translateY.value = withTiming(0, {
            duration: SETTLE_FADE_IN_MS,
            easing: DASHBOARD_MOTION_EASE,
          });
        }
      },
    );
  }, [animationKey, opacity, reduceMotion, slide, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: slide ? [{ translateY: translateY.value }] : [],
  }));

  if (reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      {visibleChildren}
    </Animated.View>
  );
}
