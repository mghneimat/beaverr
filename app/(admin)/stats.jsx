import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { invokeAdminApi } from '../../lib/admin/adminApi';
import { C, S, T } from '../../constants/onboarding-theme';

const DAY_OPTIONS = [7, 30, 90];

function StatCard({ label, value, sub }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 160,
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        marginRight: 12,
        marginBottom: 12,
      }}
    >
      <Text style={{ color: C.textMuted, fontSize: 13, marginBottom: 4 }}>{label}</Text>
      <Text style={{ ...T.sectionTitle, color: C.text }}>{value}</Text>
      {sub ? <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{sub}</Text> : null}
    </View>
  );
}

export default function AdminStatsScreen() {
  const { t } = useI18n();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await invokeAdminApi('stats.overview', { days });
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setStats(result.data);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: S.pagePadH, paddingVertical: S.pagePadV }}>
      <Text style={{ ...T.pageTitle, color: C.text, marginBottom: 16 }}>{t('admin.stats.title')}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
        {DAY_OPTIONS.map((d) => (
          <Pressable
            key={d}
            onPress={() => setDays(d)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              marginRight: 8,
              backgroundColor: days === d ? C.accent : C.surface,
              borderWidth: 1,
              borderColor: days === d ? C.accent : C.border,
            }}
          >
            <Text style={{ color: days === d ? '#fff' : C.textMuted }}>{t('admin.stats.days', { count: d })}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={C.accent} />
      ) : error ? (
        <Text style={{ color: C.danger }}>{error}</Text>
      ) : stats ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <StatCard label={t('admin.stats.totalUsers')} value={String(stats.totalUsers)} />
            <StatCard label={t('admin.stats.signups7d')} value={String(stats.signups7d)} />
            <StatCard label={t('admin.stats.signups30d')} value={String(stats.signups30d)} />
            <StatCard label={t('admin.stats.households')} value={String(stats.householdsWithData)} />
            <StatCard label={t('admin.stats.adviceRuns')} value={String(stats.adviceRuns)} />
            <StatCard
              label={t('admin.stats.aiSpend')}
              value={`$${Number(stats.adviceSpendUsd ?? 0).toFixed(4)}`}
            />
            <StatCard label={t('admin.stats.chatRuns')} value={String(stats.chatRuns)} />
          </View>

          <Text style={{ ...T.sectionTitle, color: C.text, marginTop: 8, marginBottom: 8 }}>
            {t('admin.stats.topRules')}
          </Text>
          {(stats.topRules ?? []).map((row) => (
            <Text key={row.id} style={{ color: C.textMuted, marginBottom: 4 }}>
              {row.id}: {row.count}
            </Text>
          ))}

          <Text style={{ ...T.sectionTitle, color: C.text, marginTop: 16, marginBottom: 8 }}>
            {t('admin.stats.topChunks')}
          </Text>
          {(stats.topChunks ?? []).map((row) => (
            <Text key={row.id} style={{ color: C.textMuted, marginBottom: 4 }}>
              {row.id}: {row.count}
            </Text>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}
