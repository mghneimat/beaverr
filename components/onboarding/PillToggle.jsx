import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { C } from '../../constants/onboarding-theme';

/**
 * A single pill toggle with hover/press/selected states.
 * Updated to match UI Examples design — selected pills get navy bg, unselected get light bg with border.
 *
 * @param {Object} props
 * @param {string} props.label - Display label
 * @param {boolean} props.selected - Whether this pill is selected
 * @param {Function} props.onPress - Press handler
 * @param {number} [props.paddingVertical=14] - Vertical padding
 * @param {number} [props.paddingHorizontal=20] - Horizontal padding
 * @param {number} [props.fontSize=13] - Label font size
 * @param {string} [props.fontWeight='600'] - Label font weight
 * @param {boolean} [props.darker=false] - Stronger overlay for Yes/No toggles
 * @param {number} [props.borderRadius=0] - Border radius (0 = flush inside container)
 */
export default function PillToggle({
  label,
  selected,
  onPress,
  paddingVertical = 14,
  paddingHorizontal = 20,
  fontSize = 13,
  fontWeight = '600',
  darker = false,
  borderRadius = 0,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  // When selected: navy background with white text (UI Examples style)
  // When unselected: light background with border
  const bgColor = selected
    ? C.pillSelectedBg
    : hovered
      ? C.bg
      : pressed
        ? C.bg
        : C.pillUnselectedBg;

  const borderWidth = selected ? 0 : 1;
  const borderColor = C.pillUnselectedBorder;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        flex: 1,
        paddingVertical,
        paddingHorizontal,
        borderRadius,
        backgroundColor: bgColor,
        borderWidth,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{
        fontSize,
        fontWeight,
        color: selected ? C.pillSelectedText : C.pillUnselectedText,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}
