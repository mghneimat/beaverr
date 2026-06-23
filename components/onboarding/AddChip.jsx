import { Text } from 'react-native';
import { C, R } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';
import { addButtonBg } from './pressableFeedback';

/**
 * Dashed "add" chip — sits inline with SuggestionChip rows instead of AddAnotherButton.
 *
 * @param {string} label - Chip label (e.g. "+ Add other cost")
 * @param {Function} onPress - Press handler
 * @param {object} [style] - Extra styles (width defaults to 48% to match suggestion chips)
 */
export default function AddChip({ label, onPress, style }) {
  return (
    <OnboardingPressable
      onPress={onPress}
      style={({ pressed, hovered }) => ({
        width: '48%',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: R.chip,
        borderWidth: 2,
        borderColor: C.addBorder,
        borderStyle: 'dashed',
        backgroundColor: addButtonBg({ pressed, hovered }),
        marginBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      })}
    >
      <Text style={{ fontSize: 13, color: C.addText, fontWeight: '500' }}>
        {label}
      </Text>
    </OnboardingPressable>
  );
}
