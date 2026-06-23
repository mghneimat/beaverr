import { View, Text } from 'react-native';
import OnboardingPressable from './OnboardingPressable';
import { chipBg } from './pressableFeedback';
import { useI18n } from '../../lib/i18n';
import { C, S, T, R } from '../../constants/onboarding-theme';
import {
  CHILD_AGE_GROUPS,
  childAgeGroupChipLabelKey,
} from '../../lib/childrenCostsCatalog';

function AgeGroupPill({ selected, onPress, label }) {
  return (
    <OnboardingPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed, hovered }) => ({
        flex: 1,
        minWidth: 0,
        minHeight: 44,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: R.pill,
        borderWidth: selected ? 0 : 1.5,
        borderColor: C.pillUnselectedBorder,
        backgroundColor: chipBg({ pressed, hovered, active: selected, activeBg: C.pillSelectedBg }),
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: 13,
          lineHeight: 16,
          textAlign: 'center',
          fontWeight: selected ? '600' : '500',
          color: selected ? C.pillSelectedText : C.pillUnselectedText,
        }}
      >
        {label}
      </Text>
    </OnboardingPressable>
  );
}

/**
 * Age-group chip row for children-costs — equal-width pills spanning full width.
 */
export default function AgeGroupPills({ value, onChange, label }) {
  const { t } = useI18n();

  return (
    <View style={{ marginBottom: 16, width: '100%' }}>
      {label ? (
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: S.labelGap }}>{label}</Text>
      ) : null}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={{
          width: '100%',
          flexDirection: 'row',
          gap: 8,
        }}
      >
        {CHILD_AGE_GROUPS.map((ageGroup) => {
          const labelKey = childAgeGroupChipLabelKey(ageGroup);
          const chipLabel = t(labelKey);
          return (
            <AgeGroupPill
              key={ageGroup}
              selected={value === ageGroup}
              onPress={() => onChange(ageGroup)}
              label={chipLabel !== labelKey ? chipLabel : ageGroup}
            />
          );
        })}
      </View>
    </View>
  );
}
