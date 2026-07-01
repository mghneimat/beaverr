import { View, Platform, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { C } from '../../constants/onboarding-theme';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useSpinningBorder } from './cycles/useSpinningBorder';
import { COACH_FAB_GLOW_PRESET, getCoachFabGlowPreset } from './coachFabGlowPreset';

/**
 * Circular ocean-sunset spinning ring for the Ask Beaverr FAB.
 * Dedicated layout — pill CycleAnimatedBorderShell inner did not fill small circles.
 *
 * @param {import('react').ReactNode} props.children
 * @param {number} [props.size]
 * @param {Partial<import('./coachFabGlowPreset').CoachFabGlowPreset>} [props.presetOverrides]
 */
export default function CoachFabGlowShell({
  children,
  size = COACH_FAB_GLOW_PRESET.size,
  presetOverrides,
}) {
  const preset = getCoachFabGlowPreset(presetOverrides);
  const reduceMotion = useReducedMotion();
  const { spinEnabled, rotation } = useSpinningBorder(preset.spinDurationMs);

  const borderWidth = preset.borderWidth;
  const borderRadius = size / 2;
  const innerRadius = Math.max(borderRadius - borderWidth, 0);
  const showSpin = spinEnabled && !reduceMotion;

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const outerStyle = [
    styles.outer,
    {
      width: size,
      height: size,
      borderRadius,
      ...(Platform.OS === 'web' && preset.webHalo ? { boxShadow: preset.webHalo } : {}),
    },
  ];

  const innerDisc = {
    ...StyleSheet.absoluteFillObject,
    top: borderWidth,
    right: borderWidth,
    bottom: borderWidth,
    left: borderWidth,
    borderRadius: innerRadius,
    backgroundColor: C.surface,
    zIndex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (!showSpin) {
    return (
      <View
        style={[
          outerStyle,
          {
            borderWidth,
            borderColor: preset.nativeBorderColor,
            backgroundColor: C.surface,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {children}
      </View>
    );
  }

  const spinLayerSize = size * 4;
  const spinInset = -(spinLayerSize - size) / 2;

  return (
    <View style={outerStyle}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: spinLayerSize,
            height: spinLayerSize,
            left: spinInset,
            top: spinInset,
            backgroundImage: preset.conicGradient,
            zIndex: 0,
          },
          spinStyle,
        ]}
      />
      <View style={innerDisc}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
    overflow: 'hidden',
  },
});
