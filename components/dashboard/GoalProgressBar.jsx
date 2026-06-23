import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, tabularNums } from '../../constants/onboarding-theme';

export default function GoalProgressBar({ percent, percentLabel, dimmed = false }) {
  const clamped = Math.min(100, Math.max(0, Number(percent) || 0));
  const rounded = Math.round(clamped);
  const isComplete = clamped >= 100;
  const displayLabel = percentLabel ?? `${rounded}%`;
  const trackColor = dimmed ? C.disabled : C.divider;
  const fillColor = dimmed
    ? C.muted
    : isComplete
      ? C.positive
      : C.accent;
  const labelColor = dimmed || !isComplete ? C.muted : C.positive;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{
        flex: 1,
        height: 8,
        borderRadius: R.input,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}>
        <View style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: R.input,
          backgroundColor: fillColor,
        }} />
      </View>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: labelColor,
          flexShrink: 0,
          maxWidth: '42%',
          textAlign: 'right',
          ...tabularNums,
        }}
        numberOfLines={1}
      >
        {displayLabel}
      </Text>
    </View>
  );
}
