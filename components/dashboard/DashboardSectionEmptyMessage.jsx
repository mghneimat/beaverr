import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';

/**
 * Plain muted text for empty dashboard sections — no background or border.
 * @param {'inline'|'centered'} [variant]
 */
export default function DashboardSectionEmptyMessage({
  message,
  variant = 'inline',
  style,
}) {
  return (
    <Text
      style={{
        ...T.helper,
        color: C.muted,
        ...(variant === 'centered'
          ? { textAlign: 'center', paddingVertical: 24, paddingHorizontal: 16 }
          : undefined),
        ...style,
      }}
    >
      {message}
    </Text>
  );
}
