import { Pressable, Text } from 'react-native';
import { C, R } from '../../constants/onboarding-theme';

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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ([{
        paddingVertical: 12,
        borderRadius: R.input,
        borderWidth: 2,
        borderColor: C.addBorder,
        borderStyle: 'dashed',
        alignItems: 'center',
        backgroundColor: pressed ? C.addPressed : 'transparent',
      }, style])}
    >
      <Text style={{ fontSize: 14, color: C.addText, fontWeight: '500' }}>
        {label}
      </Text>
    </Pressable>
  );
}
