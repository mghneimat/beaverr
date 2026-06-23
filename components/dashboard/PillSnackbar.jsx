import { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useI18n } from '../../lib/i18n';
import { subscribeDashboardToast } from '../../lib/dashboardToast';
import { C, R, T } from '../../constants/onboarding-theme';
import { DASHBOARD_MOTION_DURATION_FAST, DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { elevationShadow } from '../../lib/shadow';

const DISMISS_MS = 3200;

/**
 * Pill-shaped snackbar for inline save/delete feedback on dashboard screens.
 */
export default function PillSnackbar() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [toast, setToast] = useState(null);
  const progress = useSharedValue(0);

  useEffect(() => subscribeDashboardToast((payload) => {
    setToast(payload);
  }), []);

  useEffect(() => {
    if (!toast) {
      progress.value = 0;
      return undefined;
    }
    if (reduceMotion) {
      progress.value = 1;
    } else {
      progress.value = withTiming(1, {
        duration: DASHBOARD_MOTION_DURATION_FAST,
        easing: DASHBOARD_MOTION_EASE,
      });
    }
    const timer = setTimeout(() => {
      if (reduceMotion) {
        setToast(null);
        return;
      }
      progress.value = withTiming(0, {
        duration: DASHBOARD_MOTION_DURATION_FAST,
        easing: DASHBOARD_MOTION_EASE,
      });
      setTimeout(() => setToast(null), DASHBOARD_MOTION_DURATION_FAST);
    }, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, reduceMotion, progress]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [12, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.94, 1]) },
    ],
  }));

  if (!toast) return null;

  const label = t(`dashboard.toast.${toast.kind}`);

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 24,
        alignItems: 'center',
        zIndex: 1000,
        pointerEvents: 'box-none',
        ...(Platform.OS === 'web' ? { position: 'fixed' } : {}),
      }}
    >
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[{
          paddingVertical: 10,
          paddingHorizontal: 22,
          borderRadius: R.pill,
          backgroundColor: C.pillSelectedBg,
          ...elevationShadow({ offsetY: 6, blur: 16, opacity: 0.16 }),
        }, animStyle]}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.pillSelectedText, lineHeight: 18 }}>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}
