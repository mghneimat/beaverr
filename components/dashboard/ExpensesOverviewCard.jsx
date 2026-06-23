import { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter, useSegments } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { toMonthly } from '../../lib/finance';
import { categoryMonthlyTotal } from '../../lib/householdBudget';
import { useDashboardFrequency } from '../../lib/useDashboardFrequency';
import { navigateFromDashboard } from '../../lib/screenTransition';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import DashboardFrequencyDropdown from './DashboardFrequencyDropdown';
import { formatDashboardAmount } from './formatDashboardAmount';
import ExpandCollapseIcon from '../onboarding/ExpandCollapseIcon';

export default function ExpensesOverviewCard({ financials, currency, daysInMonth }) {
  const { t } = useI18n();
  const router = useRouter();
  const { frequency, setFrequency } = useDashboardFrequency('monthly');
  const [expanded, setExpanded] = useState({});

  const categories = (financials.byCategory || [])
    .map((cat) => ({ ...cat, monthlyTotal: categoryMonthlyTotal(cat) }))
    .filter((cat) => cat.monthlyTotal > 0)
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

  const totalMonthly = financials.fixedCosts || 0;

  if (!categories.length) {
    return (
      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.home.chart.expensesTitle')} />
        <Text style={{ ...T.helper }}>{t('dashboard.home.chart.empty')}</Text>
      </SurfaceCard>
    );
  }

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <SurfaceCard>
      <InCardSectionHeader
        title={t('dashboard.home.chart.expensesTitle')}
        trailing={(
          <DashboardFrequencyDropdown value={frequency} onChange={setFrequency} compact />
        )}
        style={{ marginBottom: 0 }}
      />
      <Pressable
        onPress={() => navigateFromDashboard(router, 'costs')}
        accessibilityRole="button"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: C.primary, ...tabularNums }}>
            {formatDashboardAmount(totalMonthly, frequency, currency, daysInMonth)}
          </Text>
        </View>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
          {t('dashboard.home.chart.expensesSubtitle')}
        </Text>
      </Pressable>

      {categories.map((cat, idx) => {
        const isOpen = expanded[cat.category] ?? idx < 2;
        return (
          <View key={cat.category} style={{ borderTopWidth: 1, borderTopColor: C.divider }}>
            <Pressable
              onPress={() => toggle(cat.category)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              style={({ pressed, hovered }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                backgroundColor: pressed ? C.overlayPressed : hovered ? C.overlayHover : 'transparent',
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
              })}
            >
              {({ pressed, hovered }) => (
                <>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: C.primary }} numberOfLines={1}>
                    {cat.label}
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary, marginRight: 8, ...tabularNums }}>
                    {formatDashboardAmount(cat.monthlyTotal, frequency, currency, daysInMonth)}
                  </Text>
                  <ExpandCollapseIcon expanded={isOpen} color={C.muted} compact size={14} hovered={hovered} pressed={pressed} />
                </>
              )}
            </Pressable>
            {isOpen ? (
              <View style={{ paddingBottom: 10, paddingLeft: 4 }}>
                {cat.items.map((item, itemIdx) => (
                  <View
                    key={`${item.label}-${itemIdx}`}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 5 }}
                  >
                    <Text style={{ ...T.caption, color: C.muted, flex: 1 }} numberOfLines={2}>
                      {item.label}
                    </Text>
                    <Text style={{ ...T.caption, fontWeight: '500', color: C.text, ...tabularNums }}>
                      {formatDashboardAmount(toMonthly(item.amount, item.frequency), frequency, currency, daysInMonth)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </SurfaceCard>
  );
}
