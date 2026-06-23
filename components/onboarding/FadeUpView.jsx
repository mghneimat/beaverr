import { useRef, useLayoutEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { USE_NATIVE_DRIVER } from '../../lib/animation';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Animated wrapper that fades in + slides up its children.
 * Re-triggers when `animationKey` changes (step transitions, route mounts).
 */
export default function FadeUpView({
  children,
  animationKey,
  duration = 400,
  translateY = 12,
  style,
}) {
  const reduceMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translate = useRef(new Animated.Value(reduceMotion ? 0 : translateY)).current;
  const animationRef = useRef(null);

  useLayoutEffect(() => {
    animationRef.current?.stop();

    if (reduceMotion) {
      opacity.setValue(1);
      translate.setValue(0);
      return;
    }

    opacity.setValue(0);
    translate.setValue(translateY);

    animationRef.current = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);

    animationRef.current.start();

    return () => {
      animationRef.current?.stop();
    };
  }, [animationKey, duration, translateY, reduceMotion, opacity, translate]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY: translate }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
