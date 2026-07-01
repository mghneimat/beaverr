import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { C, S, T } from '../../constants/onboarding-theme';

const NAV_ITEMS = [
  { href: '/(admin)/stats', key: 'stats' },
  { href: '/(admin)/users', key: 'users' },
  { href: '/(admin)/errors', key: 'errors' },
  { href: '/(admin)/knowledge', key: 'knowledge' },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <View
      style={{
        width: 240,
        borderRightWidth: 1,
        borderRightColor: C.border,
        backgroundColor: C.surface,
        paddingTop: S.pagePadV,
        paddingHorizontal: 12,
      }}
    >
      <Text style={{ ...T.sectionTitle, color: C.text, marginBottom: 16, paddingHorizontal: 8 }}>
        {t('admin.title')}
      </Text>
      <ScrollView>
        {NAV_ITEMS.map((item) => {
          const active = pathname?.includes(item.key);
          return (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.href)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                marginBottom: 4,
                backgroundColor: active ? C.accentSoft : 'transparent',
              }}
            >
              <Text style={{ color: active ? C.accent : C.textMuted, fontWeight: active ? '600' : '400' }}>
                {t(`admin.nav.${item.key}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable
        onPress={() => router.replace('/(app)/dashboard')}
        style={{ marginTop: 24, paddingHorizontal: 12, paddingVertical: 10 }}
      >
        <Text style={{ color: C.accent }}>{t('admin.backToApp')}</Text>
      </Pressable>
    </View>
  );
}
