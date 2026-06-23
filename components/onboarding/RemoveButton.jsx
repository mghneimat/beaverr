import { useState } from 'react';
import { Text, Pressable } from 'react-native';
import { C, R, INPUT_FIELD } from '../../constants/onboarding-theme';

/** Fixed square size for alignment with input fields in a row. */
export const REMOVE_BUTTON_SIZE = INPUT_FIELD.minHeight;

/**
 * Square ✕ remove button with hover/press overlay.
 *
 * @param {Object} props
 * @param {Function} props.onPress - Remove handler
 */
export default function RemoveButton({ onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        width: REMOVE_BUTTON_SIZE,
        height: REMOVE_BUTTON_SIZE,
        borderRadius: R.md || 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hovered || pressed ? C.dangerBg : 'transparent',
      }}
    >
      <Text style={{ fontSize: 18, color: C.danger, lineHeight: 20 }}>{'✕'}</Text>
    </Pressable>
  );
}
