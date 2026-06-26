import { Text } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';

/**
 * Centred text delete control for onboarding list cards.
 *
 * @param {Object} props
 * @param {Function} props.onPress
 * @param {string} [props.label]
 * @param {object} [props.style]
 */
export default function DeleteTextButton({ onPress, label, style }) {
  const { t } = useI18n();

  return (
    <OnboardingPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label || t('common.delete')}
      style={({ pressed, hovered }) => ([{
        alignSelf: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginTop: 4,
        ...(pressed || hovered ? { opacity: 0.75 } : null),
      }, style])}
    >
      <Text style={{ ...T.btnAdd, color: C.danger, textAlign: 'center' }}>
        {label || t('common.delete')}
      </Text>
    </OnboardingPressable>
  );
}
