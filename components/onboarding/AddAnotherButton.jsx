import { Text } from 'react-native';
import { C, T } from '../../constants/onboarding-theme';
import { useI18n } from '../../lib/i18n';
import OnboardingPressable from './OnboardingPressable';

/**
 * Standardised borderless "Add" link for onboarding repeating rows.
 *
 * @param {Object} props
 * @param {string} [props.label] - Defaults to common.add
 * @param {Function} props.onPress
 * @param {'left'|'center'} [props.align='center']
 * @param {object} [props.style]
 */
export default function AddAnotherButton({ label, onPress, align = 'center', style }) {
  const { t } = useI18n();
  const text = label ?? t('common.add');

  return (
    <OnboardingPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={text}
      style={({ pressed, hovered }) => ([{
        alignSelf: align === 'center' ? 'center' : 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 4,
        ...(pressed || hovered ? { opacity: 0.75 } : null),
      }, style])}
    >
      <Text style={{ ...T.btnAdd, color: C.accent, textAlign: align }}>
        {text}
      </Text>
    </OnboardingPressable>
  );
}
