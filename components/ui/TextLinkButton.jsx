import { Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C } from '../../constants/onboarding-theme';

/**
 * Borderless text link — for Edit, Cancel, and secondary actions in settings cards.
 */
export default function TextLinkButton({
  label,
  onPress,
  disabled = false,
  centered = false,
  destructive = false,
  accessibilityLabel,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={({ pressed, hovered }) => ({
        alignSelf: centered ? 'center' : 'flex-start',
        minHeight: 44,
        justifyContent: 'center',
        paddingVertical: 4,
        opacity: disabled ? 0.45 : pressed ? 0.72 : hovered && Platform.OS === 'web' ? 0.85 : 1,
        ...(Platform.OS === 'web' ? { cursor: disabled ? 'default' : 'pointer' } : {}),
      })}
    >
      <Text style={{
        fontSize: 15,
        fontWeight: '600',
        color: destructive ? C.danger : C.accent,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}
