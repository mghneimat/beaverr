import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import PillToggle from '../onboarding/PillToggle';
import { C, R } from '../../constants/onboarding-theme';
import { DASHBOARD_MOTION_DURATION, DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';

const TRACK_WIDTH = 260;
const TRACK_PADDING = 4;
const SEGMENT_GAP = 4;
const PILL_WIDTH = (TRACK_WIDTH - TRACK_PADDING * 2 - SEGMENT_GAP) / 2;

export default function GoalsFilterToggle({ value, onChange, activeLabel, archivedLabel }) {
  const reduceMotion = useReducedMotion();
  const selectedIndex = useSharedValue(value === 'active' ? 0 : 1);
  const options = [
    { key: 'active', label: activeLabel },
    { key: 'archived', label: archivedLabel },
  ];

  useEffect(() => {
    const next = value === 'active' ? 0 : 1;
    selectedIndex.value = reduceMotion
      ? next
      : withTiming(next, {
        duration: DASHBOARD_MOTION_DURATION,
        easing: DASHBOARD_MOTION_EASE,
      });
  }, [value, reduceMotion, selectedIndex]);

  const indicatorMotionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selectedIndex.value * (PILL_WIDTH + SEGMENT_GAP) }],
  }));

  const indicatorShellStyle = {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    width: PILL_WIDTH,
    borderRadius: R.button,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  };

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <View
        accessibilityRole="radiogroup"
        style={{
          flexDirection: 'row',
          gap: SEGMENT_GAP,
          alignSelf: 'center',
          width: TRACK_WIDTH,
          backgroundColor: C.bg,
          borderRadius: R.pill,
          padding: TRACK_PADDING,
          borderWidth: 1,
          borderColor: C.border,
          position: 'relative',
        }}
      >
        <Animated.View style={[indicatorShellStyle, indicatorMotionStyle]} pointerEvents="none" />
        {options.map(({ key, label }) => (
          <PillToggle
            key={key}
            label={label}
            selected={value === key}
            onPress={() => onChange(key)}
            paddingVertical={8}
            paddingHorizontal={16}
            fontSize={14}
            fontWeight="500"
            borderRadius={R.button}
            variant="segment"
            minHeight={40}
            hideSelectedSurface
          />
        ))}
      </View>
    </View>
  );
}
