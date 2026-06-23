import { Pressable, View, Platform } from 'react-native';
import { C } from '../../constants/onboarding-theme';
import { useClearOnboardingValidation } from '../../lib/onboardingValidationClear';

/**
 * iOS-style on/off switch for onboarding cards and forms.
 */
export default function OnOffSwitch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}) {
  const clearValidation = useClearOnboardingValidation();

  const handlePress = () => {
    clearValidation?.();
    onValueChange(!value);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        ...(Platform.OS === 'web' && !disabled ? { cursor: 'pointer' } : {}),
      })}
    >
      <View style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: value ? C.accent : C.border,
        padding: 2,
        justifyContent: 'center',
        alignItems: value ? 'flex-end' : 'flex-start',
      }}>
        <View style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: C.surface,
        }} />
      </View>
    </Pressable>
  );
}
