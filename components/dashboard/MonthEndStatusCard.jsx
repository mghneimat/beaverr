import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { buildMonthEndPreview } from '../../lib/monthEndRouting';
import {
  formatMonthEndDestination,
  formatMonthEndHistoryDestination,
} from '../../lib/monthEndLabels';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';

export default function MonthEndStatusCard({ financials, currency, onOpenBudget }) {
  const { t } = useI18n();
  const budget = financials.budget || {};
  const preview = buildMonthEndPreview({
    budget,
    effectiveMonthlyFlexible: financials.effectiveMonthlyFlexible ?? financials.monthlyFlexible,
    dailyLogs: financials.dailyLogs || [],
  });

  const rolloverBalance = Number(budget.rolloverBalance) || 0;
  const history = budget.monthEndHistory || [];
  const lastClosed = history.length > 0 ? history[history.length - 1] : null;
  const projectedDest = preview.projectedLeftover > 0
    ? formatMonthEndDestination(t, preview, currency)
    : null;

  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable
        onPress={onOpenBudget}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.home.monthEndStatus.a11y')}
        style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
      >
        <SurfaceCard>
          <Text style={{ ...T.cardTitle, marginBottom: 16 }}>
            {t('dashboard.home.monthEndStatus.title')}
          </Text>

          {rolloverBalance > 0 ? (
            <View style={{ marginBottom: lastClosed || projectedDest ? 12 : 0 }}>
              <Text style={{ ...T.caption, color: C.muted }}>{t('dashboard.home.monthEndStatus.rolloverBalance')}</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: C.primary, marginTop: 4, ...tabularNums }}>
                {formatCurrency(rolloverBalance, currency)}
              </Text>
            </View>
          ) : null}

          {lastClosed ? (
            <View style={{
              marginBottom: projectedDest ? 12 : 0,
              paddingTop: rolloverBalance > 0 ? 12 : 0,
              borderTopWidth: rolloverBalance > 0 ? 1 : 0,
              borderTopColor: C.divider,
            }}>
              <Text style={{ ...T.caption, color: C.muted }}>
                {t('dashboard.home.monthEndStatus.lastClosed', { period: lastClosed.period })}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', marginTop: 4, gap: 4 }}>
                <Text style={{ ...T.helper, fontWeight: '600', color: C.primary, ...tabularNums }}>
                  {formatCurrency(lastClosed.amount, currency)}
                </Text>
                <Text style={{ ...T.helper, fontWeight: '600', color: C.primary }}>
                  {' · '}
                  {formatMonthEndHistoryDestination(t, lastClosed.destination)}
                </Text>
              </View>
            </View>
          ) : null}

          {projectedDest ? (
            <View style={{
              paddingTop: (rolloverBalance > 0 || lastClosed) ? 12 : 0,
              borderTopWidth: (rolloverBalance > 0 || lastClosed) ? 1 : 0,
              borderTopColor: C.divider,
            }}>
              <Text style={{ ...T.caption, color: C.muted }}>{t('dashboard.home.monthEndStatus.projected')}</Text>
              <Text style={{ ...T.helper, fontWeight: '600', color: C.primary, marginTop: 4 }}>
                {t('dashboard.home.monthEndStatus.projectedAmount', {
                  amount: formatCurrency(preview.projectedLeftover, currency),
                })}
              </Text>
              <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>{projectedDest}</Text>
            </View>
          ) : (
            <View style={{
              paddingTop: (rolloverBalance > 0 || lastClosed) ? 12 : 0,
              borderTopWidth: (rolloverBalance > 0 || lastClosed) ? 1 : 0,
              borderTopColor: C.divider,
            }}>
              <Text style={{ ...T.caption, color: C.muted }}>{t('dashboard.home.monthEndStatus.projected')}</Text>
              <Text style={{ ...T.helper, color: C.muted, marginTop: 4 }}>
                {t('dashboard.trackerScreen.monthly.noLeftover')}
              </Text>
            </View>
          )}
        </SurfaceCard>
      </Pressable>
    </View>
  );
}
