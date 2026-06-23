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
import { DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';

const GLOW_FADE_IN_MS = 380;
const GLOW_HOLD_MS = 240;
const GLOW_FADE_OUT_MS = 380;
const GLOW_FADE_OUT_EASE = Easing.bezier(0.4, 0, 0.2, 1);

const INSIGHT_GLOW_RGBA = 'rgba(59, 130, 246, 0.55)';
const INSIGHT_SHADOW_RGBA = 'rgba(59, 130, 246, 0.28)';

const insightOutlineStyle = {
  borderColor: C.insightGlow,
  ...(Platform.OS === 'web'
    ? { boxShadow: `0 0 12px ${INSIGHT_SHADOW_RGBA}, 0 0 0 2px ${INSIGHT_GLOW_RGBA}` }
    : {
        shadowColor: C.insightGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 5,
      }),
};

/**
 * Resize-aware light-blue outline glow — absoluteFill overlay tracks parent height.
 * @param {number} glowToken — increment to retrigger (e.g. on Learn more toggle)
 */
export default function InsightOutlineGlow({
  glowToken = 0,
  onComplete,
  children,
  borderRadius = R.card,
}) {
  const reduceMotion = useReducedMotion();
  const glow = useSharedValue(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

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
    <View style={styles.wrap}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius,
            borderWidth: 2,
            ...insightOutlineStyle,
          },
          glowStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
});
