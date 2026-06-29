import { useState } from 'react';
import { View, Text } from 'react-native';
import { C, R, T } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';
import AnimatedAccordionBody from './AnimatedAccordionBody';
import { CardHeaderExpandIcon } from '../dashboard/CardHeaderActionButton';
import { washBg } from './pressableFeedback';
import SelectableServicePill from './SelectableServicePill';

/**
 * Single-select expandable card with service-style pills (subscriptions category pattern).
 */
export default function ExpandableChipSelect({
  label,
  value,
  options,
  getOptionLabel,
  onChange,
  placeholder,
  style,
}) {
  const [expanded, setExpanded] = useState(() => !value);
  const selectedLabel = value ? getOptionLabel(value) : null;
  const isOpen = expanded;

  const handleSelect = (option) => {
    onChange(option);
    setExpanded(false);
  };

  return (
    <View style={[{
      marginBottom: 20,
      borderRadius: R.card,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
      overflow: 'hidden',
    }, style]}>
      <OnboardingPressable
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          gap: 12,
        }}
        style={({ pressed, hovered }) => ({
          width: '100%',
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: washBg({ pressed, hovered }, C.surface),
        })}
      >
        {({ hovered, pressed }) => (
          <>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 2 }}>{label}</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: selectedLabel ? C.text : C.muted,
                }}
                numberOfLines={1}
              >
                {selectedLabel ?? placeholder}
              </Text>
            </View>
            <CardHeaderExpandIcon expanded={isOpen} color={C.muted} hovered={hovered} pressed={pressed} />
          </>
        )}
      </OnboardingPressable>

      <AnimatedAccordionBody open={isOpen}>
        <View style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: C.divider,
        }}>
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}
            accessibilityRole="radiogroup"
            accessibilityLabel={label}
          >
            {options.map((option) => (
              <SelectableServicePill
                key={option}
                label={getOptionLabel(option)}
                active={value === option}
                onPress={() => handleSelect(option)}
                style={{ width: '48%', marginRight: 0, alignItems: 'center' }}
              />
            ))}
          </View>
        </View>
      </AnimatedAccordionBody>
    </View>
  );
}
