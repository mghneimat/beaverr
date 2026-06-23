import { useCallback, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';
import SplitDateFields from '../onboarding/SplitDateFields';

function DeadlineModeChip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed, hovered }) => ({
        flex: 1,
        paddingVertical: 12,
        borderRadius: R.pill,
        borderWidth: selected ? 0 : 1.5,
        borderColor: selected ? C.chipSelectedBorder : C.border,
        backgroundColor: selected
          ? C.chipSelectedBg
          : pressed
            ? C.overlayPressed
            : hovered
              ? C.bg
              : C.surface,
        alignItems: 'center',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <Text style={{
        fontSize: 13,
        color: selected ? C.chipSelectedText : C.pillUnselectedText,
        fontWeight: selected ? '600' : '500',
      }}
      >
        {label}
      </Text>
    </Pressable>
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
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
        <DeadlineModeChip
          label={t('dashboard.goalsScreen.deadlineMode.none')}
          selected={!hasDeadline}
          onPress={() => onModeChange('none')}
        />
        <DeadlineModeChip
          label={t('dashboard.goalsScreen.deadlineMode.set')}
          selected={hasDeadline}
          onPress={() => onModeChange('set')}
        />
      </View>
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
