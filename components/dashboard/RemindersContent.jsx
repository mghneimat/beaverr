import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { subscribeDashboardRefresh, notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { getReminderPrefs, getDefaultLeadDays } from '../../lib/reminderPreferences';
import { S } from '../../constants/onboarding-theme';
import RemindersTable from './RemindersTable';
import AlertsContent from './AlertsContent';
import InCardSectionHeader from './InCardSectionHeader';

/**
 * Alerts tab body — receives bundle from DashboardPageShell; loads reminder prefs locally.
 */
export default function RemindersContent({ bundle }) {
  const { t } = useI18n();
  const [prefs, setPrefs] = useState({});
  const [defaultLeadDays, setDefaultLeadDays] = useState(7);

  const loadPrefs = async () => {
    const [reminderPrefs, leadDays] = await Promise.all([
      getReminderPrefs(),
      getDefaultLeadDays(),
    ]);
    setPrefs(reminderPrefs);
    setDefaultLeadDays(leadDays);
  };

  useEffect(() => {
    loadPrefs();
  }, []);

  useEffect(() => subscribeDashboardRefresh(loadPrefs), []);

  const activeCount = bundle.activeAlerts?.length ?? 0;

  return (
    <View style={{ gap: S.tabSectionGap }}>
      <RemindersTable
        financials={bundle.financials}
        prefs={prefs}
        defaultLeadDays={defaultLeadDays}
      />

      {activeCount > 0 ? (
        <View style={{ gap: S.tabSectionTightGap }}>
          <InCardSectionHeader title={t('dashboard.remindersScreen.activeTitle')} />
          <AlertsContent bundle={bundle} onRefresh={notifyDashboardRefresh} />
        </View>
      ) : null}
    </View>
  );
}
