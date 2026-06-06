import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Animated wrapper that fades in + slides up its children.
 *
 * Mimics the CSS animation from pocketos-new-onboarding-design-v2.html:
 *   @keyframes fadeUp {
 *     from { opacity: 0; transform: translateY(18px); }
 *     to   { opacity: 1; transform: translateY(0); }
 *   }
 *   .screen { animation: fadeUp 0.35s ease both; }
 *
 * The animation re-triggers whenever the `animationKey` prop changes, making it
 * perfect for step transitions within a screen (e.g. when `currentStep`
 * changes in household.jsx) or for mount animations on splash screens.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to animate
 * @param {any} [props.animationKey] - When this changes, the animation replays
 * @param {number} [props.duration=400] - Animation duration in ms
 * @param {number} [props.translateY=12] - Starting vertical offset in px
 * @param {object} [props.style] - Additional styles for the animated container
 */
export default function FadeUpView({ children, animationKey, duration = 400, translateY = 12, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(translateY)).current;

  // Track the animationKey so we can re-trigger when it changes
  const animKey = useRef(animationKey);

  const runAnimation = () => {
    // Reset to start values
    opacity.setValue(0);
    translate.setValue(translateY);

    // Snappy ease-out that settles quickly without lingering at the end
    // Using a custom cubic-bezier: fast start, smooth settle
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    runAnimation();
    animKey.current = animationKey;
  }, [animationKey]);

  // Also run on initial mount even if key hasn't changed
  useEffect(() => {
    runAnimation();
  }, []);

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
