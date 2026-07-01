import { Platform, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { C } from '../../../constants/onboarding-theme';
import {
  GRADIENT_ACTIVE,
  GRADIENT_IDLE,
  GRADIENT_LAYER,
  GRADIENT_LAYER_PILL,
  TILE_GRADIENTS,
} from './cycleGradientBorderShared';

const NATIVE_TONE_STYLE = {
  grey: {
    borderColor: C.muted,
    backgroundColor: C.surface,
  },
  red: {
    borderColor: C.heroExpenseBorder,
    backgroundColor: C.heroExpenseBg,
  },
  insight: {
    borderColor: C.insightCardBorder,
    backgroundColor: C.surface,
  },
};

/**
 * Shared rotating conic-gradient ring — pay-cycle (green/red) or tile (grey/red).
 */
export default function CycleAnimatedBorderShell({
  borderAnim,
  borderWidth,
  borderRadius,
  innerBackgroundColor = C.surface,
  style,
  settleStyle,
  variant = 'card',
  /** `cycle` crossfades green↔red; `grey` / `red` / `insight` single-tone tile rings */
  tone = 'cycle',
  /** Overrides TILE_GRADIENTS[tone] — e.g. theme-aware insight ring */
  gradientImage,
  /** Added to shared rotation so tiles can start at different angles */
  spinPhaseDeg = 0,
  children,
}) {
  const {
    spinEnabled,
    rotation,
    idleGradientStyle,
    activeGradientStyle,
    nativeBorderStyle,
    nativeBorderRingStyle,
    cardSettleStyle,
  } = borderAnim;

  const gradientSpinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value + spinPhaseDeg}deg` }],
  }));

  const settleStyleResolved = settleStyle ?? cardSettleStyle;

  const innerRadius = Math.max(borderRadius - borderWidth, 0);
  const gradientLayer = variant === 'pill' ? GRADIENT_LAYER_PILL : GRADIENT_LAYER;
  const isCycleTone = tone === 'cycle';
  const tileGradient = gradientImage ?? TILE_GRADIENTS[tone];
  const nativeStyle = isCycleTone
    ? (variant === 'card' ? nativeBorderStyle : nativeBorderRingStyle)
    : NATIVE_TONE_STYLE[tone];

  const outerBase = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius,
  };

  const innerAbsolute = {
    position: 'absolute',
    top: borderWidth,
    right: borderWidth,
    bottom: borderWidth,
    left: borderWidth,
    borderRadius: innerRadius,
    backgroundColor: innerBackgroundColor,
    overflow: 'hidden',
    zIndex: 1,
  };

  const innerPadded = {
    borderRadius: innerRadius,
    backgroundColor: innerBackgroundColor,
    overflow: 'hidden',
    zIndex: 1,
  };

  if (Platform.OS === 'web' && spinEnabled) {
    if (variant === 'pill') {
      return (
        <View style={[outerBase, { padding: borderWidth }, style]}>
          {isCycleTone ? (
            <>
              <Animated.View
                style={[
                  gradientLayer,
                  { backgroundImage: GRADIENT_IDLE },
                  gradientSpinStyle,
                  idleGradientStyle,
                ]}
              />
              <Animated.View
                style={[
                  gradientLayer,
                  { backgroundImage: GRADIENT_ACTIVE },
                  gradientSpinStyle,
                  activeGradientStyle,
                ]}
              />
            </>
          ) : (
            <Animated.View
              style={[
                gradientLayer,
                { backgroundImage: tileGradient },
                gradientSpinStyle,
              ]}
            />
          )}
          <View style={innerPadded}>{children}</View>
        </View>
      );
    }

    return (
      <Animated.View style={[outerBase, style, isCycleTone ? settleStyleResolved : null]}>
        {isCycleTone ? (
          <>
            <Animated.View
              style={[
                gradientLayer,
                { backgroundImage: GRADIENT_IDLE },
                gradientSpinStyle,
                idleGradientStyle,
              ]}
            />
            <Animated.View
              style={[
                gradientLayer,
                { backgroundImage: GRADIENT_ACTIVE },
                gradientSpinStyle,
                activeGradientStyle,
              ]}
            />
          </>
        ) : (
          <Animated.View
            style={[
              gradientLayer,
              { backgroundImage: tileGradient },
              gradientSpinStyle,
            ]}
          />
        )}
        <View style={innerAbsolute}>{children}</View>
      </Animated.View>
    );
  }

  const innerNative = variant === 'card' ? innerAbsolute : innerPadded;

  return (
    <Animated.View
      style={[
        outerBase,
        { borderWidth },
        nativeStyle,
        style,
        isCycleTone ? settleStyleResolved : null,
      ]}
    >
      <View style={innerNative}>{children}</View>
    </Animated.View>
  );
}
