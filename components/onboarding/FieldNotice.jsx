import { Text } from '@gluestack-ui/themed';
import { C } from '../../constants/onboarding-theme';

/**
 * Inline success / info message — green text below fields (not an error).
 */
export default function FieldNotice({ message, style }) {
  if (!message) return null;

  return (
    <Text
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      style={{
        marginTop: 4,
        fontSize: 13,
        lineHeight: 18,
        color: C.positive,
        ...style,
      }}
    >
      {message}
    </Text>
  );
}
