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
  compact = false,
  destructive = false,
  color,
  accessibilityLabel,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={compact ? { top: 4, bottom: 4, left: 4, right: 4 } : { top: 8, bottom: 8, left: 4, right: 4 }}
      style={({ pressed, hovered }) => ({
        alignSelf: centered ? 'center' : compact ? 'center' : 'flex-start',
        flexShrink: compact ? 0 : undefined,
        minHeight: compact ? undefined : 44,
        justifyContent: 'center',
        paddingVertical: compact ? 2 : 4,
        paddingHorizontal: compact ? 6 : 0,
        borderRadius: compact ? 6 : 0,
        opacity: disabled ? 0.45 : pressed ? 0.72 : 1,
        ...(hovered && Platform.OS === 'web'
          ? { backgroundColor: compact ? C.navSelectedBg : undefined, opacity: disabled ? 0.45 : pressed ? 0.72 : 0.85 }
          : {}),
        ...(Platform.OS === 'web' ? { cursor: disabled ? 'default' : 'pointer' } : {}),
      })}
    >
      <Text style={{
        fontSize: compact ? 13 : 15,
        fontWeight: '600',
        lineHeight: compact ? 18 : undefined,
        color: destructive ? C.danger : (color ?? C.accent),
      }}>
        {label}
      </Text>
    </Pressable>
  );
}
