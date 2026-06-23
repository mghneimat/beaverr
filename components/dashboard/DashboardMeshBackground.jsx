import { useId, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { C } from '../../constants/onboarding-theme';
import { SHOWCASE_BLUE_WASH, SHOWCASE_GRAIN } from '../../constants/dashboard-showcase';

/** Navy gradient + subtle blue wash + white dot grain for Cost commitments / Jars. */
export default function DashboardMeshBackground() {
  const reactId = useId().replace(/:/g, '');
  const navyId = `showcaseNavy-${reactId}`;
  const washId = `showcaseBlueWash-${reactId}`;
  const dotsId = `meshDots-${reactId}`;
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: C.primaryPressed, pointerEvents: 'none' }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width > 0 && height > 0) {
          setSize((prev) => (
            prev.width === width && prev.height === height ? prev : { width, height }
          ));
        }
      }}
    >
      {size.width > 0 && size.height > 0 ? (
        <Svg
          width={size.width}
          height={size.height}
          style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        >
          <Defs>
            <LinearGradient id={navyId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={C.primaryPressed} />
              <Stop offset="55%" stopColor={C.primary} />
              <Stop offset="100%" stopColor="#243F5C" />
            </LinearGradient>
            <RadialGradient id={washId} cx="72%" cy="38%" rx="95%" ry="90%">
              <Stop offset="0%" stopColor={C.accentPressed} stopOpacity={SHOWCASE_BLUE_WASH.centerOpacity} />
              <Stop offset="55%" stopColor={C.accentPressed} stopOpacity={SHOWCASE_BLUE_WASH.midOpacity} />
              <Stop offset="100%" stopColor={C.accentPressed} stopOpacity="0" />
            </RadialGradient>
            <Pattern id={dotsId} width="14" height="14" patternUnits="userSpaceOnUse">
              <Circle cx="2.5" cy="2.5" r="1.1" fill={SHOWCASE_GRAIN.dot} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${navyId})`} />
          <Rect width="100%" height="100%" fill={`url(#${washId})`} />
          <Rect width="100%" height="100%" fill={`url(#${dotsId})`} opacity={SHOWCASE_GRAIN.opacity} />
        </Svg>
      ) : null}
    </View>
  );
}
