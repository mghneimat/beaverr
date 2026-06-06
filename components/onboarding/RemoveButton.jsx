import { useState } from 'react';
import { Text, Pressable } from 'react-native';
import { C } from '../../constants/onboarding-theme';

/**
 * Small ✕ remove button with hover/press overlay effect.
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
        padding: 8,
        borderRadius: 6,
        alignSelf: 'center',
        backgroundColor: hovered || pressed
          ? C.dangerBg
          : 'transparent',
      }}
    >
      <Text style={{ fontSize: 18, color: C.danger }}>✕</Text>
    </Pressable>
  );
}
