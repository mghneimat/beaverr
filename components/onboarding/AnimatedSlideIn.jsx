import { useRef, useEffect, useState, useCallback } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useReducedMotion } from '../../lib/useReducedMotion';

/** Upper bound while content height is measured — long forms (e.g. health insurance) exceed 2000px. */
const FALLBACK_EXPANDED_MAX = 12000;

/**
 * Animated wrapper that fades + slides its children in/out.
 *
 * Uses `useNativeDriver: false` with maxHeight so hidden children
 * properly collapse to zero height, preventing unwanted whitespace.
 * `overflow` is set to `'hidden'` only during the collapse animation
 * to avoid clipping child elements (e.g. TextInput focus rings) when visible.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether children should be visible
 * @param {React.ReactNode} props.children - Content to animate
 * @param {number} [props.duration=280] - Animation duration in ms
 * @param {number} [props.spacingTop=0] - Gap above revealed content (e.g. after Yes/No toggle)
 */
export default function AnimatedSlideIn({ visible, children, duration = 280, spacingTop = 0 }) {
  const reduceMotion = useReducedMotion();
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
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
      anim.setValue(visible ? 1 : 0);
      return;
    }

    if (visible) {
      const timer = setTimeout(() => setOverflowHidden(false), duration);
      return () => clearTimeout(timer);
    }
    setOverflowHidden(true);
  }, [visible, reduceMotion, duration, anim]);

  useEffect(() => {
    if (reduceMotion) {
      anim.setValue(visible ? 1 : 0);
      return;
    }

    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    }).start();
  }, [visible, reduceMotion, duration, anim]);

  if (reduceMotion) {
    return visible ? (
      <>
        {spacingTop > 0 ? <View style={{ height: spacingTop }} /> : null}
        {children}
      </>
    ) : null;
  }

  const expandedMax = contentHeight > 0 ? contentHeight : FALLBACK_EXPANDED_MAX;

  const spacerHeight = spacingTop > 0
    ? anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, spacingTop],
    })
    : 0;

  return (
    <Animated.View
      style={{
        opacity: anim,
        maxHeight: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, expandedMax],
        }),
        overflow: overflowHidden ? 'hidden' : 'visible',
      }}
    >
      {spacingTop > 0 ? (
        <Animated.View style={{ height: spacerHeight }} />
      ) : null}
      <View onLayout={handleContentLayout} collapsable={false}>
        {children}
      </View>
    </Animated.View>
  );
}
