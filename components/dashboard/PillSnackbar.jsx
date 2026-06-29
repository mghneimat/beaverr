import { useEffect, useLayoutEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@gluestack-ui/themed';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useI18n } from '../../lib/i18n';
import { subscribeDashboardToast } from '../../lib/dashboardToast';
import { C, R } from '../../constants/onboarding-theme';
import { DASHBOARD_MOTION_DURATION_FAST, DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { elevationShadow } from '../../lib/shadow';

const DISMISS_MS = 3200;

/**
 * Pill-shaped snackbar for inline save/delete feedback on dashboard screens.
 */
export default function PillSnackbar() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [toast, setToast] = useState(null);
  const progress = useSharedValue(0);

  useEffect(() => subscribeDashboardToast((payload) => {
    setToast(payload);
  }), []);

  useLayoutEffect(() => {
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

  const label = toast ? t(`dashboard.toast.${toast.kind}`) : '';

  if (!toast) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: Math.max(24, insets.bottom),
        zIndex: 10000,
        ...(Platform.OS === 'web' ? { cursor: 'default' } : null),
      }}
    >
      <Animated.View
        pointerEvents="none"
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[{
          paddingVertical: 10,
          paddingHorizontal: 22,
          borderRadius: R.pill,
          backgroundColor: C.selectedBg,
          maxWidth: '92%',
          ...elevationShadow({ offsetY: 6, blur: 16, opacity: 0.16 }),
        }, animStyle]}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.selectedText, lineHeight: 18 }}>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}
