import { Text, View } from 'react-native';
import { C } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';
import { washBg } from './pressableFeedback';

const ROW_CONTENT = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
};

/**
 * Pill-shaped select trigger — label left, chevron right (matches FormInput fields).
 */
export default function DropdownTrigger({ onPress, label, placeholder, value, style }) {
  const display = value ?? placeholder;
  const isPlaceholder = !value;

  return (
    <OnboardingPressable
      onPress={onPress}
      accessibilityRole="button"
      contentStyle={ROW_CONTENT}
      style={({ pressed, hovered }) => ({
        ...style,
        backgroundColor: washBg({ pressed, hovered }, style?.backgroundColor ?? C.surface),
      })}
    >
      <Text
        style={{
          flex: 1,
          fontSize: 17,
          fontWeight: isPlaceholder ? '300' : '400',
          color: isPlaceholder ? C.placeholder : C.text,
        }}
        numberOfLines={1}
      >
        {display}
      </Text>
      <Text style={{ fontSize: 14, color: C.muted, marginLeft: 8, flexShrink: 0 }}>{'▼'}</Text>
    </OnboardingPressable>
  );
}

/** Read-only field styled like DropdownTrigger — no chevron. */
export function DropdownTriggerReadOnly({ label, value, style }) {
  return (
    <View
      style={[
        style,
        ROW_CONTENT,
        { opacity: 0.92 },
      ]}
    >
      <Text style={{ flex: 1, fontSize: 17, fontWeight: '400', color: C.text }} numberOfLines={1}>
        {value ?? label}
      </Text>
    </View>
  );
}
