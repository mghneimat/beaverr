import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { navigateFromDashboard } from '../../lib/screenTransition';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import { loadDashboardBundle } from '../../lib/dashboardData';
import { subscribeDashboardRefresh } from '../../lib/dashboardRefresh';
import { buildDashboardActionQueue } from '../../lib/dashboardAlerts';
import { C, S, T } from '../../constants/onboarding-theme';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import { webScrollBottomPadding } from '../../lib/safeAreaWeb';
import PrimaryButton from '../ui/PrimaryButton';
import SettleCrossfade from '../ui/SettleCrossfade';
import ActionQueuePreview from './ActionQueuePreview';
import DashboardPlanOverview from './DashboardPlanOverview';
import TrackerSnapshotCard from './TrackerSnapshotCard';
import TabSectionStack from './TabSectionStack';
const DASHBOARD_MAX_WIDTH = 900;

export default function DashboardHome() {
  const { t } = useI18n();
  const router = useRouter();
  const { pagePadH, titleFontSize } = useDashboardLayout();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bundle, setBundle] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await loadDashboardBundle(t);
      setBundle(data);
    } catch {
      setError(t('dashboard.home.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeDashboardRefresh(load), [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const goTo = (route) => navigateFromDashboard(router, route);

  const viewKey = loading ? 'loading' : error ? 'error' : 'content';
  const data = bundle?.financials;
  const insights = bundle?.insights;
  const currency = data ? getCurrencySymbol(data.currencyCode) : null;
  const previewAlerts = bundle && data
    ? buildDashboardActionQueue(bundle.alerts, insights, data, 3)
    : [];

  return (
    <SettleCrossfade animationKey={viewKey} style={{ flex: 1 }}>
      {loading ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t('dashboard.home.loading')}
          style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}
        >
          <Text style={{ ...T.helper }}>{t('dashboard.home.loading')}</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
          <Text style={{ ...T.helper, textAlign: 'center', marginBottom: 24, maxWidth: 320, color: C.danger }}>
            {error}
          </Text>
          <PrimaryButton onPress={load}>{t('common.retry')}</PrimaryButton>
        </View>
      ) : !bundle ? null : (
        <ScrollView
      style={{ flex: 1, backgroundColor: C.bg, width: '100%', maxWidth: '100%' }}
      contentContainerStyle={{
        paddingHorizontal: pagePadH,
        paddingVertical: S.pagePadV,
        paddingBottom: webScrollBottomPadding(S.pagePadV),
        maxWidth: DASHBOARD_MAX_WIDTH,
        width: '100%',
        alignSelf: 'center',
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
      }
    >
      <Text
        accessibilityRole="header"
        style={{ ...T.questionTitle, fontSize: titleFontSize, marginBottom: 8 }}
      >
        {t('dashboard.title')}
      </Text>
      <Text style={{ ...T.helper, marginBottom: 0 }}>
        {t('dashboard.tabRoles.dashboard')}
      </Text>

      <View style={{ marginTop: S.tabContentGap }}>
        <TabSectionStack>
          <DashboardPlanOverview
            financials={data}
            currency={currency}
            insights={insights}
          />

          <TrackerSnapshotCard
            financials={data}
            currency={currency}
            onOpenTracker={() => goTo('tracker')}
          />

          <ActionQueuePreview
            title={t('dashboard.home.actions.title')}
            alerts={previewAlerts}
            t={t}
            viewAllLabel={t('dashboard.home.actions.viewAll')}
            onViewAll={() => goTo('alerts')}
          />
        </TabSectionStack>
      </View>
    </ScrollView>
      )}
    </SettleCrossfade>
  );
}
