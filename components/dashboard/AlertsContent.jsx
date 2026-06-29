import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter, useSegments } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { dismissAlert, snoozeAlert } from '../../lib/alerts';
import { getTabInsight } from '../../lib/insights';
import { navigateToAppRoute, resolveActiveAppTab } from '../../lib/screenTransition';
import { C, R, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import TabSectionStack from './TabSectionStack';
import AIInsightSection from './AIInsightSection';
import DashboardSectionEmptyMessage from './DashboardSectionEmptyMessage';

const URGENCY_COLORS = {
  high: C.danger,
  medium: C.infoText,
  low: C.muted,
};

export default function AlertsContent({ bundle, onRefresh }) {
  const { t } = useI18n();
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = resolveActiveAppTab(segments);
  const active = bundle.alerts.filter((a) => a.status === 'active');
  const tabInsight = getTabInsight('alerts', bundle.insights, t, { alerts: bundle.alerts });

  const handleDismiss = async (id) => {
    await dismissAlert(id);
    onRefresh();
  };

  const handleSnooze = async (id) => {
    await snoozeAlert(id, 7);
    onRefresh();
  };

  if (!active.length) {
    return (
      <SurfaceCard>
        <DashboardSectionEmptyMessage
          message={t('dashboard.alertsScreen.empty')}
          variant="centered"
        />
      </SurfaceCard>
    );
  }

  return (
    <TabSectionStack>
      {tabInsight ? <AIInsightSection paragraphs={tabInsight.paragraphs} /> : null}
      {active.map((alert) => (
        <SurfaceCard key={alert.id}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: URGENCY_COLORS[alert.urgency] || C.muted,
              marginTop: 6,
            }} />
            <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: C.primary }}>
              {t(alert.messageKey, alert.messageParams)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            {alert.actionRoute ? (
              <Pressable
                onPress={() => navigateToAppRoute(router, alert.actionRoute, currentRoute)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: R.input,
                  backgroundColor: pressed ? C.accentPressed : C.accent,
                  minHeight: 36,
                  justifyContent: 'center',
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>
                  {t('dashboard.alertsScreen.review')}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => handleSnooze(alert.id)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: R.input,
                borderWidth: 1,
                borderColor: C.border,
                opacity: pressed ? 0.7 : 1,
                minHeight: 36,
                justifyContent: 'center',
              })}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.muted }}>
                {t('dashboard.alertsScreen.snooze')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleDismiss(alert.id)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                paddingVertical: 8,
                paddingHorizontal: 12,
                opacity: pressed ? 0.7 : 1,
                minHeight: 36,
                justifyContent: 'center',
              })}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.danger }}>
                {t('dashboard.alertsScreen.dismiss')}
              </Text>
            </Pressable>
          </View>
        </SurfaceCard>
      ))}
    </TabSectionStack>
  );
}
