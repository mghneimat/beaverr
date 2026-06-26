import { View, Text as RNText } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import OnboardingPressable from '../onboarding/OnboardingPressable';
import { useI18n } from '../../lib/i18n';
import { C, R, INPUT_FIELD } from '../../constants/onboarding-theme';

function ConsentCheckmark({ checked }) {
  return (
    <View style={{
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: checked ? C.pillSelectedBg : 'transparent',
      borderColor: checked ? C.pillSelectedBg : C.border,
    }}
    >
      {checked ? (
        <Text style={{ color: C.pillSelectedText, fontSize: 14, lineHeight: 16 }}>✓</Text>
      ) : null}
    </View>
  );
}

/**
 * GDPR consent checkbox with tappable link to open privacy details modal.
 */
export default function GdprConsentCheckboxRow({
  checked,
  onCheckedChange,
  onOpenDetails,
}) {
  const { t } = useI18n();
  const labelColor = checked ? C.accent : C.text;

  return (
    <View style={{
      borderRadius: R.input,
      borderWidth: 1.5,
      borderColor: checked ? C.accent : C.border,
      backgroundColor: checked ? C.infoBg : C.surface,
      paddingHorizontal: INPUT_FIELD.paddingHorizontal,
      paddingVertical: INPUT_FIELD.paddingVertical,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      width: '100%',
      alignSelf: 'stretch',
    }}
    >
      <OnboardingPressable
        onPress={() => onCheckedChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={t('auth.signup.consentLabel')}
        style={({ pressed, hovered }) => ({
          opacity: pressed || hovered ? 0.85 : 1,
          flexShrink: 0,
        })}
      >
        <ConsentCheckmark checked={checked} />
      </OnboardingPressable>

      <RNText
        style={{
          flex: 1,
          flexShrink: 1,
          fontSize: 15,
          lineHeight: 22,
        }}
      >
        <RNText
          onPress={() => onCheckedChange(!checked)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          style={{ color: labelColor }}
        >
          {t('auth.signup.consentLabel')}
        </RNText>
        {'\n'}
        <RNText
          onPress={onOpenDetails}
          accessibilityRole="link"
          accessibilityLabel={t('auth.signup.consentLink')}
          style={{
            color: C.accent,
            fontWeight: '600',
            textDecorationLine: 'underline',
          }}
        >
          {t('auth.signup.consentLink')}
        </RNText>
      </RNText>
    </View>
  );
}
