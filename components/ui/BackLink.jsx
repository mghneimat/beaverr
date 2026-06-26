import { Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';

/**
 * Text back link — same pattern as goals / money stash detail screens.
 */
export default function BackLink({ onPress, labelKey = 'common.back', style, compact = false }) {
  const { t } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t(labelKey)}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={({ pressed, hovered }) => ({
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: compact ? 32 : 44,
        marginBottom: compact ? 0 : 12,
        paddingVertical: compact ? 2 : 4,
        opacity: pressed ? 0.7 : 1,
        ...(Platform.OS === 'web' && hovered ? { opacity: 0.85 } : {}),
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        ...style,
      })}
    >
      <Text style={{ ...T.helper, fontSize: 15, fontWeight: '600', color: C.accent }}>
        {`← ${t(labelKey)}`}
      </Text>
    </Pressable>
  );
}
