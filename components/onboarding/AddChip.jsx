import { Text } from 'react-native';
import { C, T } from '../../constants/onboarding-theme';
import { useI18n } from '../../lib/i18n';
import OnboardingPressable from './OnboardingPressable';

/**
 * Inline "Add" link chip for suggestion rows.
 *
 * @param {string} [label]
 * @param {Function} onPress
 * @param {object} [style]
 */
export default function AddChip({ label, onPress, style }) {
  const { t } = useI18n();
  const text = label ?? t('common.add');

  return (
    <OnboardingPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={text}
      style={({ pressed, hovered }) => ({
        width: '48%',
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
        ...(pressed || hovered ? { opacity: 0.75 } : null),
        ...style,
      })}
    >
      <Text style={{ ...T.btnAdd, color: C.accent, fontSize: 13 }}>
        {text}
      </Text>
    </OnboardingPressable>
  );
}
