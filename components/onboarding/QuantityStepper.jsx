import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, STEPPER } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';
import { washBg } from './pressableFeedback';

const stepLabelStyle = {
  fontSize: 24,
  lineHeight: 24,
  fontWeight: '300',
  textAlign: 'center',
  includeFontPadding: false,
};

/**
 * Pill-shaped − / value / + stepper — height matches text inputs (72px).
 */
export default function QuantityStepper({
  value,
  onDecrement,
  onIncrement,
  min,
  max,
  style,
}) {
  const { t } = useI18n();
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: R.pill,
        overflow: 'hidden',
        backgroundColor: C.surface,
      }, style]}
    >
      <OnboardingPressable
        onPress={onDecrement}
        disabled={atMin}
        accessibilityRole="button"
        accessibilityLabel={t('common.decrease')}
        style={({ pressed, hovered }) => ({
          width: STEPPER.stepWidth,
          height: STEPPER.height,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: washBg({ pressed, hovered }),
          opacity: atMin ? 0.35 : 1,
        })}
      >
        <Text style={{ ...stepLabelStyle, color: atMin ? C.addBorder : C.muted }}>
          {'\u2212'}
        </Text>
      </OnboardingPressable>

      <View
        style={{
          minWidth: STEPPER.valueMinWidth,
          height: STEPPER.height,
          alignItems: 'center',
          justifyContent: 'center',
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 12,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            lineHeight: 34,
            fontWeight: '300',
            color: C.text,
            letterSpacing: -0.5,
            textAlign: 'center',
            includeFontPadding: false,
          }}
        >
          {value}
        </Text>
      </View>

      <OnboardingPressable
        onPress={onIncrement}
        disabled={atMax}
        accessibilityRole="button"
        accessibilityLabel={t('common.increase')}
        style={({ pressed, hovered }) => ({
          width: STEPPER.stepWidth,
          height: STEPPER.height,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: washBg({ pressed, hovered }),
          opacity: atMax ? 0.35 : 1,
        })}
      >
        <Text style={{ ...stepLabelStyle, color: atMax ? C.addBorder : C.muted }}>
          {'+'}
        </Text>
      </OnboardingPressable>
    </View>
  );
}
