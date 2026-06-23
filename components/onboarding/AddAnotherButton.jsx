import { Text } from 'react-native';
import { C, R, T } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';
import { addButtonBg } from './pressableFeedback';

/**
 * Standardised "Add another" dashed-border button.
 * Updated to match UI Examples — blue dashed border with blue text.
 *
 * @param {Object} props
 * @param {string} props.label - Button label text (e.g. "+ Add another debt")
 * @param {Function} props.onPress - Press handler
 * @param {object} [props.style] - Additional styles on the Pressable
 */
export default function AddAnotherButton({ label, onPress, style }) {
  return (
    <OnboardingPressable
      onPress={onPress}
      style={({ pressed, hovered }) => ([{
        width: '100%',
        alignSelf: 'stretch',
        paddingVertical: 12,
        borderRadius: R.input,
        borderWidth: 2,
        borderColor: C.addBorder,
        borderStyle: 'dashed',
        alignItems: 'center',
        backgroundColor: addButtonBg({ pressed, hovered }),
      }, style])}
    >
      <Text style={{ ...T.btnAdd, color: C.addText }}>
        {label}
      </Text>
    </OnboardingPressable>
  );
}
