import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { invokeAdminApi } from '../../lib/admin/adminApi';
import { C, S, T } from '../../constants/onboarding-theme';

export default function AdminErrorsScreen() {
  const { t } = useI18n();
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockersOnly, setBlockersOnly] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await invokeAdminApi('errors.list', { blockersOnly, limit: 100 });
    if (result.ok) setErrors(result.data?.errors ?? []);
    setLoading(false);
  }, [blockersOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (errorId) => {
    await invokeAdminApi('errors.resolve', { errorId });
    setSelected(null);
    load();
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: S.pagePadH, paddingVertical: S.pagePadV }}>
        <Text style={{ ...T.pageTitle, color: C.text, marginBottom: 16 }}>{t('admin.errors.title')}</Text>

        <Pressable
          onPress={() => setBlockersOnly((v) => !v)}
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            marginBottom: 16,
            backgroundColor: blockersOnly ? C.accent : C.surface,
            borderWidth: 1,
            borderColor: blockersOnly ? C.accent : C.border,
          }}
        >
          <Text style={{ color: blockersOnly ? '#fff' : C.textMuted }}>{t('admin.errors.blockersOnly')}</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator color={C.accent} />
        ) : errors.length === 0 ? (
          <Text style={{ color: C.textMuted }}>{t('admin.errors.empty')}</Text>
        ) : (
          errors.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => setSelected(row)}
              style={{
                borderWidth: 1,
                borderColor: selected?.id === row.id ? C.accent : C.border,
                borderRadius: 10,
                padding: 12,
                marginBottom: 8,
                backgroundColor: C.surface,
              }}
            >
              <Text style={{ color: row.severity === 'blocker' ? C.danger : C.text, fontWeight: '600' }}>
                [{row.severity}] {row.category}
              </Text>
              <Text style={{ color: C.textMuted, marginTop: 4 }} numberOfLines={2}>
                {row.message}
              </Text>
              <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 4 }}>
                {new Date(row.created_at).toLocaleString()}
                {row.resolved ? ` · ${t('admin.errors.resolved')}` : ''}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      {selected ? (
        <ScrollView
          style={{
            width: 360,
            borderLeftWidth: 1,
            borderLeftColor: C.border,
            backgroundColor: C.surface,
          }}
          contentContainerStyle={{ padding: 16 }}
        >
          <Text style={{ ...T.sectionTitle, color: C.text, marginBottom: 8 }}>{t('admin.errors.detail')}</Text>
          <Text style={{ color: C.textMuted, marginBottom: 8 }}>{selected.message}</Text>
          {selected.stack ? (
            <Text style={{ color: C.textMuted, fontSize: 11, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>
              {selected.stack}
            </Text>
          ) : null}
          {selected.context ? (
            <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 12 }}>
              {JSON.stringify(selected.context, null, 2)}
            </Text>
          ) : null}
          {!selected.resolved ? (
            <Pressable
              onPress={() => resolve(selected.id)}
              style={{
                marginTop: 16,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: C.accent,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff' }}>{t('admin.errors.markResolved')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}
