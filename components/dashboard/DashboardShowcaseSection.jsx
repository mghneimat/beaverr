import { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { C, R, S, SHADOW, T } from '../../constants/onboarding-theme';
import { compactChildren } from '../../lib/compactChildren';
import {
  DASHBOARD_MOTION_EASE,
  SHOWCASE_ENTER,
  SHOWCASE_ENTER_DURATION_MS,
} from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import DashboardShowcaseMesh from './DashboardShowcaseMesh';

const shellStyle = {
  borderRadius: R.card,
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: C.primaryPressed,
  ...SHADOW.card,
};

/**
 * Showcase block with static navy mesh — fade-up enter on mount.
 * @param {string} [enterKey] — change to replay enter (e.g. tab refocus)
 * @param {string} [meshEnterKey] — when set, mesh softly crossfades on change (jars / rollover)
 */
export default function DashboardShowcaseSection({
  title,
  subtitle,
  footerNote,
  children,
  style,
  enterKey = 'initial',
  meshEnterKey,
}) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : SHOWCASE_ENTER.opacity);
  const translateY = useSharedValue(reduceMotion ? 0 : SHOWCASE_ENTER.translateY);
  const scale = useSharedValue(reduceMotion ? 1 : SHOWCASE_ENTER.scale);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      return;
    }

    opacity.value = SHOWCASE_ENTER.opacity;
    translateY.value = SHOWCASE_ENTER.translateY;
    scale.value = SHOWCASE_ENTER.scale;

    opacity.value = withTiming(1, { duration: SHOWCASE_ENTER_DURATION_MS, easing: DASHBOARD_MOTION_EASE });
    translateY.value = withTiming(0, { duration: SHOWCASE_ENTER_DURATION_MS, easing: DASHBOARD_MOTION_EASE });
    scale.value = withTiming(1, { duration: SHOWCASE_ENTER_DURATION_MS, easing: DASHBOARD_MOTION_EASE });
  }, [enterKey, opacity, reduceMotion, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const body = (
    <>
      <DashboardShowcaseMesh meshEnterKey={meshEnterKey} />
      <View style={{ padding: S.cardPad, position: 'relative', zIndex: 1 }}>
        {compactChildren(
          <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <Text
                accessibilityRole="header"
                style={{ ...T.cardTitle, color: '#FFFFFF', flex: 1 }}
                numberOfLines={3}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text style={{ ...T.caption, color: 'rgba(255,255,255,0.72)', flexShrink: 0, maxWidth: '42%', textAlign: 'right' }} numberOfLines={3}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {children}
            {footerNote ? (
              <Text style={{ ...T.caption, color: 'rgba(255,255,255,0.65)', marginTop: 16 }}>
                {footerNote}
              </Text>
            ) : null}
          </>,
        )}
      </View>
    </>
  );

  if (reduceMotion) {
    return <View style={[shellStyle, style]}>{body}</View>;
  }

  return (
    <Animated.View style={[shellStyle, style, animatedStyle]}>
      {body}
    </Animated.View>
  );
}
