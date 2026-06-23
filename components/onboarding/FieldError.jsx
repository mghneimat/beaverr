import { Text } from '@gluestack-ui/themed';
import { C, S } from '../../constants/onboarding-theme';

/**
 * Inline validation message — plain red text below fields (option groups, etc.).
 */
export default function FieldError({ message, style }) {
  if (!message) return null;

  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        marginTop: 4,
        fontSize: 13,
        lineHeight: 16,
        color: C.danger,
        ...style,
      }}
    >
      {message}
    </Text>
  );
}
