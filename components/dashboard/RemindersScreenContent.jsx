import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { subscribeDashboardRefresh } from '../../lib/dashboardRefresh';
import { loadDashboardBundle } from '../../lib/dashboardData';
import { getReminderPrefs, getDefaultLeadDays } from '../../lib/reminderPreferences';
import { C, S, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import RemindersTable from './RemindersTable';
import AlertsContent from './AlertsContent';
import InCardSectionHeader from './InCardSectionHeader';
import PillSnackbar from './PillSnackbar';

export default function RemindersScreenContent() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bundle, setBundle] = useState(null);
  const [prefs, setPrefs] = useState({});
  const [defaultLeadDays, setDefaultLeadDays] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const [data, reminderPrefs, leadDays] = await Promise.all([
        loadDashboardBundle(t),
        getReminderPrefs(),
        getDefaultLeadDays(),
      ]);
      setBundle(data);
      setPrefs(reminderPrefs);
      setDefaultLeadDays(leadDays);
    } catch {
      setError(t('dashboard.home.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => subscribeDashboardRefresh(load), [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ ...T.helper }}>{t('dashboard.home.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
        <Text style={{ ...T.helper, color: C.danger, marginBottom: 16 }}>{error}</Text>
        <PrimaryButton onPress={load}>{t('common.retry')}</PrimaryButton>
      </View>
    );
  }

  const activeCount = bundle.activeAlerts?.length ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{
          padding: S.pagePadH,
          paddingVertical: S.pagePadV,
          maxWidth: 900,
          alignSelf: 'center',
          width: '100%',
          gap: S.tabSectionGap,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <Text style={{ ...T.questionTitle, fontSize: 28 }}>{t('dashboard.alerts')}</Text>
        <Text style={{ ...T.helper, color: C.muted, marginTop: -8 }}>
          {t('dashboard.remindersScreen.subtitle')}
        </Text>

        <RemindersTable
          financials={bundle.financials}
          prefs={prefs}
          defaultLeadDays={defaultLeadDays}
        />

        {activeCount > 0 ? (
          <View style={{ gap: S.tabSectionTightGap }}>
            <InCardSectionHeader title={t('dashboard.remindersScreen.activeTitle')} />
            <AlertsContent bundle={bundle} onRefresh={load} />
          </View>
        ) : null}
      </ScrollView>
      <PillSnackbar />
    </View>
  );
}
