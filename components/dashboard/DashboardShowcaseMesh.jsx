import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  DASHBOARD_MOTION_EASE,
  JAR_GRID_ENTER_DURATION_MS,
} from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import DashboardMeshBackground from './DashboardMeshBackground';

/**
 * Navy mesh layer — soft fade when jar/rollover content changes (not on first mount).
 */
export default function DashboardShowcaseMesh({ meshEnterKey }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const prevMeshKey = useRef(meshEnterKey);

  useEffect(() => {
    if (!meshEnterKey || reduceMotion) {
      opacity.value = 1;
      prevMeshKey.current = meshEnterKey;
      return;
    }

    if (prevMeshKey.current === meshEnterKey) {
      opacity.value = 1;
      return;
    }

    prevMeshKey.current = meshEnterKey;
    opacity.value = 0.45;
    opacity.value = withTiming(1, {
      duration: JAR_GRID_ENTER_DURATION_MS,
      easing: DASHBOARD_MOTION_EASE,
    });
  }, [meshEnterKey, opacity, reduceMotion]);

  const meshStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!meshEnterKey || reduceMotion) {
    return (
      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
        <DashboardMeshBackground />
      </View>
    );
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFill, meshStyle, { pointerEvents: 'none' }]}>
      <DashboardMeshBackground />
    </Animated.View>
  );
}
