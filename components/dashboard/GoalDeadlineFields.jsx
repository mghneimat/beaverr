import { useCallback, useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';
import { DASHBOARD_MOTION_DURATION, DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import PillToggle from '../onboarding/PillToggle';
import SplitDateFields from '../onboarding/SplitDateFields';

const TRACK_PADDING = 4;
const SEGMENT_GAP = 4;

function DeadlineModeToggle({ value, onChange, noneLabel, setLabel }) {
  const reduceMotion = useReducedMotion();
  const trackWidth = useSharedValue(0);
  const selectedIndex = useSharedValue(value === 'set' ? 1 : 0);

  useEffect(() => {
    const next = value === 'set' ? 1 : 0;
    selectedIndex.value = reduceMotion
      ? next
      : withTiming(next, {
        duration: DASHBOARD_MOTION_DURATION,
        easing: DASHBOARD_MOTION_EASE,
      });
  }, [value, reduceMotion, selectedIndex]);

  const pillWidth = useDerivedValue(() => {
    if (trackWidth.value <= 0) return 0;
    return (trackWidth.value - TRACK_PADDING * 2 - SEGMENT_GAP) / 2;
  });

  const indicatorShellStyle = {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    borderRadius: R.button,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  };

  const indicatorMotionStyle = useAnimatedStyle(() => ({
    width: pillWidth.value,
    transform: [{ translateX: selectedIndex.value * (pillWidth.value + SEGMENT_GAP) }],
  }));

  return (
    <View
      accessibilityRole="radiogroup"
      onLayout={(event) => {
        trackWidth.value = event.nativeEvent.layout.width;
      }}
      style={{
        flexDirection: 'row',
        gap: SEGMENT_GAP,
        width: '100%',
        backgroundColor: C.bg,
        borderRadius: R.pill,
        padding: TRACK_PADDING,
        borderWidth: 1,
        borderColor: C.border,
        position: 'relative',
        marginBottom: 8,
      }}
    >
      <Animated.View style={[indicatorShellStyle, indicatorMotionStyle]} pointerEvents="none" />
      <PillToggle
        label={noneLabel}
        selected={value === 'none'}
        onPress={() => onChange('none')}
        paddingVertical={12}
        paddingHorizontal={16}
        fontSize={13}
        fontWeight="500"
        borderRadius={R.button}
        variant="segment"
        minHeight={40}
        hideSelectedSurface
      />
      <PillToggle
        label={setLabel}
        selected={value === 'set'}
        onPress={() => onChange('set')}
        paddingVertical={12}
        paddingHorizontal={16}
        fontSize={13}
        fontWeight="500"
        borderRadius={R.button}
        variant="segment"
        minHeight={40}
        hideSelectedSurface
      />
    </View>
  );
}

export default function GoalDeadlineFields({
  mode,
  onModeChange,
  endDate,
  onEndDateChange,
  minSelectableDate,
  onElevatedChange,
  errorText,
  sectionStyle,
}) {
  const { t } = useI18n();
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const hasDeadline = mode === 'set';

  const handleElevatedChange = useCallback((open) => {
    setDateDropdownOpen(open);
    onElevatedChange?.(open);
  }, [onElevatedChange]);

  const wrapperStyle = [
    { marginBottom: 16, overflow: 'visible' },
    sectionStyle,
    dateDropdownOpen ? {
      zIndex: 200,
      elevation: 12,
      ...(Platform.OS === 'web' ? { position: 'relative' } : null),
    } : null,
  ];

  return (
    <View style={wrapperStyle}>
      <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
        {t('dashboard.goalsScreen.deadlineLabel')}
      </Text>
      <DeadlineModeToggle
        value={mode}
        onChange={onModeChange}
        noneLabel={t('dashboard.goalsScreen.deadlineMode.none')}
        setLabel={t('dashboard.goalsScreen.deadlineMode.set')}
      />
      <Text style={{ ...T.caption, color: C.muted, marginBottom: hasDeadline ? 12 : 0 }}>
        {t('dashboard.goalsScreen.deadlineMode.helper')}
      </Text>
      {hasDeadline ? (
        <SplitDateFields
          value={endDate}
          onChange={onEndDateChange}
          minSelectableDate={minSelectableDate}
          errorText={errorText}
          onElevatedChange={handleElevatedChange}
        />
      ) : null}
    </View>
  );
}
