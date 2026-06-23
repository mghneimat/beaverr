import { useCallback, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { markObligationPaid } from '../../lib/obligations';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';

function formatCreatedDate(iso, locale) {
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return new Date(iso).toLocaleDateString(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Open pay-cycle payback obligations — shown on Expenses → Debts.
 */
export default function CycleObligationsCard({ obligations = [], currency }) {
  const { t, locale } = useI18n();
  const [payingId, setPayingId] = useState(null);

  const open = (obligations || []).filter((row) => row.status === 'open');
  if (open.length === 0) return null;

  const handleMarkPaid = useCallback(async (id) => {
    setPayingId(id);
    try {
      await markObligationPaid(id);
      notifyDashboardRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setPayingId(null);
    }
  }, []);

  return (
    <SurfaceCard style={{ marginBottom: 12 }}>
      <InCardSectionHeader title={t('dashboard.expensesScreen.obligations.title')} />
      <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
        {t('dashboard.expensesScreen.obligations.helper')}
      </Text>
      <View style={{ gap: 8 }}>
        {open.map((row, index) => (
          <View
            key={row.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 10,
              paddingHorizontal: 14,
              minHeight: 52,
              borderRadius: R.pill,
              backgroundColor: index % 2 === 1 ? C.breakdownStripeBg : 'transparent',
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: C.text }} numberOfLines={1}>
                {t(`dashboard.cycles.coverage.externalTypes.${row.source}`)}
              </Text>
              <Text style={{ ...T.caption, color: C.muted, marginTop: 2, ...tabularNums }}>
                {t('dashboard.expensesScreen.obligations.fromCycle', {
                  date: formatCreatedDate(row.createdAt, locale),
                })}
              </Text>
              {row.note ? (
                <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }} numberOfLines={2}>
                  {row.note}
                </Text>
              ) : null}
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: C.danger,
                ...tabularNums,
              }}
            >
              {formatCurrency(row.remainingAmount, currency)}
            </Text>
            <Pressable
              onPress={() => handleMarkPaid(row.id)}
              disabled={payingId === row.id}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.expensesScreen.obligations.markPaidA11y', {
                amount: formatCurrency(row.remainingAmount, currency),
              })}
              style={({ pressed }) => ({
                opacity: payingId === row.id ? 0.5 : pressed ? 0.75 : 1,
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
              })}
            >
              <Text style={{ ...T.caption, color: C.accent, fontWeight: '600' }}>
                {payingId === row.id
                  ? t('dashboard.expensesScreen.obligations.paying')
                  : t('dashboard.expensesScreen.obligations.markPaid')}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}
