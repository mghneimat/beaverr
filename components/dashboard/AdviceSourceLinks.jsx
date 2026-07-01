import { View, Pressable, Linking, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';

/**
 * Official source links returned from advice-chat (country KB).
 */
export default function AdviceSourceLinks({ sources = [] }) {
  const { t } = useI18n();

  if (!Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  const openUrl = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: C.border,
      }}
    >
      <Text style={{ ...T.helper, fontSize: 12, fontWeight: '600', color: C.muted, marginBottom: 8 }}>
        {t('dashboard.chat.sourcesTitle')}
      </Text>
      {sources.map((source) => (
        <Pressable
          key={source.id}
          onPress={() => openUrl(source.official_url)}
          accessibilityRole="link"
          accessibilityLabel={source.title}
          style={({ pressed }) => ({
            paddingVertical: 6,
            opacity: pressed ? 0.7 : 1,
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.accent }}>
            {source.title}
          </Text>
          {source.last_reviewed ? (
            <Text style={{ ...T.helper, fontSize: 11, color: C.muted, marginTop: 2 }}>
              {t('dashboard.chat.sourceReviewed', { date: source.last_reviewed })}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
