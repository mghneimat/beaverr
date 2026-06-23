import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';
import { washBg } from './pressableFeedback';

/**
 * Secondary skip action — outline pill, full width, neutral hover (matches dashboard secondary controls).
 */
export default function SkipButton({
  label,
  onPress,
  accessibilityLabel,
  style,
  containerStyle,
  marginTop = 16,
  disabled = false,
}) {
  return (
    <View style={[{ marginTop, width: '100%' }, containerStyle]}>
      <OnboardingPressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        style={({ pressed, hovered }) => ([{
          minHeight: 44,
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: R.button,
          borderWidth: 1.5,
          borderColor: C.border,
          backgroundColor: washBg({ pressed, hovered }, C.surface),
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'stretch',
          width: '100%',
          opacity: disabled ? 0.5 : 1,
        }, style])}
      >
        <Text
          style={{
            ...T.btnPrimary,
            fontSize: 13,
            lineHeight: 18,
            color: C.primary,
            textAlign: 'center',
          }}
          numberOfLines={2}
        >
          {label}
        </Text>
      </OnboardingPressable>
    </View>
  );
}
