import { useEffect } from 'react';
import { View, Platform } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { C, R } from '../../constants/onboarding-theme';
import { useReducedMotion } from '../../lib/useReducedMotion';

const GLYPH_VIEW = 18;
const GLYPH_CENTER = GLYPH_VIEW / 2;
const GLYPH_ARM = 5;
const GLYPH_STROKE = 2;

function PlusMinusGlyph({ minus = false, color, size }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${GLYPH_VIEW} ${GLYPH_VIEW}`}>
      <Line
        x1={GLYPH_CENTER - GLYPH_ARM}
        y1={GLYPH_CENTER}
        x2={GLYPH_CENTER + GLYPH_ARM}
        y2={GLYPH_CENTER}
        stroke={color}
        strokeWidth={GLYPH_STROKE}
        strokeLinecap="round"
      />
      {!minus ? (
        <Line
          x1={GLYPH_CENTER}
          y1={GLYPH_CENTER - GLYPH_ARM}
          x2={GLYPH_CENTER}
          y2={GLYPH_CENTER + GLYPH_ARM}
          stroke={color}
          strokeWidth={GLYPH_STROKE}
          strokeLinecap="round"
        />
      ) : null}
    </Svg>
  );
}

/**
 * Animated + / − toggle for expand/collapse rows (replaces ▲/▼ chevrons).
 */
export default function ExpandCollapseIcon({
  expanded = false,
  color = C.primary,
  active = false,
  compact = false,
  size,
  style,
  hovered = false,
  pressed = false,
  showHoverTarget = true,
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(expanded ? 1 : 0);
  const iconColor = active ? C.accent : color;
  const glyphSize = size ?? (compact ? 14 : 16);
  const targetSize = showHoverTarget ? Math.max(glyphSize + 14, compact ? 28 : 32) : glyphSize;
  const hoverBg = pressed
    ? C.overlayPressed
    : hovered
      ? C.overlayHover
      : 'transparent';

  useEffect(() => {
    progress.value = reduceMotion
      ? (expanded ? 1 : 0)
      : withTiming(expanded ? 1 : 0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
  }, [expanded, reduceMotion, progress]);

  const plusStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 1 - progress.value * 0.12 }],
  }));

  const minusStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.88 + progress.value * 0.12 }],
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[{
        width: targetSize,
        height: targetSize,
        borderRadius: R.chip,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: showHoverTarget ? hoverBg : 'transparent',
        ...(Platform.OS === 'web' && showHoverTarget ? { transition: 'background-color 120ms ease' } : {}),
      }, style]}
    >
      <View style={{ width: glyphSize, height: glyphSize }}>
        <Animated.View
          style={[{
            position: 'absolute',
            top: 0,
            left: 0,
            width: glyphSize,
            height: glyphSize,
            alignItems: 'center',
            justifyContent: 'center',
          }, plusStyle]}
        >
          <PlusMinusGlyph color={iconColor} size={glyphSize} />
        </Animated.View>
        <Animated.View
          style={[{
            position: 'absolute',
            top: 0,
            left: 0,
            width: glyphSize,
            height: glyphSize,
            alignItems: 'center',
            justifyContent: 'center',
          }, minusStyle]}
        >
          <PlusMinusGlyph minus color={iconColor} size={glyphSize} />
        </Animated.View>
      </View>
    </View>
  );
}
