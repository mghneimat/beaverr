import { useRef, useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

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
 */
export default function AnimatedSlideIn({ visible, children, duration = 280 }) {
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [overflowHidden, setOverflowHidden] = useState(!visible);

  useEffect(() => {
    if (visible) {
      // Delay removing overflow:hidden until the expand animation completes
      const timer = setTimeout(() => setOverflowHidden(false), duration);
      return () => clearTimeout(timer);
    } else {
      // Immediately apply overflow:hidden before collapse starts
      setOverflowHidden(true);
    }
  }, [visible]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    }).start();
  }, [visible]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        maxHeight: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 2000],
        }),
        overflow: overflowHidden ? 'hidden' : 'visible',
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-8, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
