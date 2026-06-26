import { Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R } from '../../constants/onboarding-theme';

/**
 * Tappable row inside dashboard cards — comfortable hover padding on web.
 */
export default function CardActionRow({
  label,
  onPress,
  destructive = false,
  accessibilityLabel,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: R.pill,
        backgroundColor: pressed || hovered ? C.overlayHover : 'transparent',
      })}
    >
      <Text style={{
        fontSize: 15,
        fontWeight: '600',
        color: destructive ? C.danger : C.text,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}
