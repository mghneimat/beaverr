import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';
import { USE_NATIVE_DRIVER } from '../../lib/animation';
import { hideWebBootLoader, BOOT_LOADER } from '../../lib/bootLoader';
import { translate } from '../../lib/translateCore';
import { useReducedMotion } from '../../lib/useReducedMotion';

function BootSpinner({ reduceMotion }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return undefined;

    const anim = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
        borderColor: 'rgba(59, 130, 246, 0.22)',
        borderTopColor: C.accent,
        transform: [{ rotate: reduceMotion ? '0deg' : spin }],
      }}
    />
  );
}

/**
 * Branded full-screen loader shown while fonts, locale, or launch routing initialize.
 */
export default function AppLoadingScreen({ label, accessibilityLabel }) {
  const reduceMotion = useReducedMotion();
  const resolvedLabel = label ?? translate('en', 'common.loading');
  const resolvedA11y = accessibilityLabel ?? resolvedLabel;

  useEffect(() => {
    hideWebBootLoader();
  }, []);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={resolvedA11y}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BOOT_LOADER.bg,
        gap: 20,
        paddingHorizontal: 24,
      }}
    >
      <BootSpinner reduceMotion={reduceMotion} />

      {resolvedLabel ? (
        <Text style={{ ...T.helper, color: C.muted, textAlign: 'center' }}>
          {resolvedLabel}
        </Text>
      ) : null}
    </View>
  );
}
