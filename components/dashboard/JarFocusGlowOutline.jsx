import { useEffect, useRef } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { R, C } from '../../constants/onboarding-theme';
import { GLASS_ON_MESH } from '../../constants/dashboard-showcase';
import { DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';

const GLOW_FADE_IN_MS = 380;
const GLOW_HOLD_MS = 240;
const GLOW_FADE_OUT_MS = 380;
const GLOW_FADE_OUT_EASE = Easing.bezier(0.4, 0, 0.2, 1);

function glowStyles(variant) {
  if (variant === 'surface') {
    return {
      borderColor: C.primary,
      ...(Platform.OS === 'web'
        ? { boxShadow: `0 0 10px rgba(26, 43, 74, 0.28), 0 0 0 2px rgba(26, 43, 74, 0.45)` }
        : {
            shadowColor: C.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 4,
          }),
    };
  }

  return {
    borderColor: GLASS_ON_MESH.borderActive,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 0 12px rgba(255, 255, 255, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.55)' }
      : {
          shadowColor: '#FFFFFF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.85,
          shadowRadius: 8,
          elevation: 6,
        }),
  };
}

/**
 * One-shot glow outline — no fill wash. Eases in, holds, then eases out (~1s total).
 * @param {number} glowToken — increment to retrigger
 */
export default function JarFocusGlowOutline({
  glowToken = 0,
  onComplete,
  children,
  borderRadius = R.card,
  variant = 'glass',
  fill = true,
}) {
  const reduceMotion = useReducedMotion();
  const glow = useSharedValue(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const outlineStyle = glowStyles(variant);

  useEffect(() => {
    if (!glowToken) return;

    if (reduceMotion) {
      glow.value = 1;
      const timer = setTimeout(() => {
        glow.value = 0;
        completeRef.current?.();
      }, GLOW_HOLD_MS);
      return () => clearTimeout(timer);
    }

    glow.value = 0;
    glow.value = withSequence(
      withTiming(1, { duration: GLOW_FADE_IN_MS, easing: DASHBOARD_MOTION_EASE }),
      withTiming(1, { duration: GLOW_HOLD_MS }),
      withTiming(0, { duration: GLOW_FADE_OUT_MS, easing: GLOW_FADE_OUT_EASE }, (finished) => {
        if (finished && completeRef.current) {
          runOnJS(completeRef.current)();
        }
      }),
    );
  }, [glowToken, glow, reduceMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={fill ? styles.wrap : styles.wrapNatural}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius,
            borderWidth: 2,
            ...outlineStyle,
          },
          glowStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    position: 'relative',
  },
  wrapNatural: {
    alignSelf: 'stretch',
    position: 'relative',
  },
});
