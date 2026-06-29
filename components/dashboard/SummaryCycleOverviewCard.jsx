import { Text } from '@gluestack-ui/themed';
import { View } from 'react-native';
import { useMemo } from 'react';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import { useI18n } from '../../lib/i18n';
import { computeCyclePace } from '../../lib/cyclePace';
import { buildCycleCountBurnRate } from '../../lib/cycleBurnRate';
import { computeSummaryCycleCounts, computeSummaryCycleOverview } from '../../lib/summaryCycleStats';
import { formatCurrency } from '../../lib/finance';
import SurfaceCard from '../ui/SurfaceCard';
import DashboardSectionEmptyMessage from './DashboardSectionEmptyMessage';
import {
  BurnRateBar,
  BurnRateHorizontalLegend,
  BurnRateIncomePill,
} from './BurnRateVisuals';

function formatRange(cycle, locale) {
  if (!cycle?.startedAt) return '';
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const start = new Date(
    Number(cycle.startedAt.slice(0, 4)),
    Number(cycle.startedAt.slice(5, 7)) - 1,
    Number(cycle.startedAt.slice(8, 10)),
  );
  const end = cycle.closedAt
    ? new Date(
      Number(cycle.closedAt.slice(0, 4)),
      Number(cycle.closedAt.slice(5, 7)) - 1,
      Number(cycle.closedAt.slice(8, 10)),
    )
    : start;
  const fmt = (d) => d.toLocaleDateString(tag, { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function buildBurnAnimationKey(burn) {
  return `${burn.income}|${burn.segments.map((seg) => `${seg.key}:${seg.value}`).join(',')}`;
}

function formatCycleCount(t, count) {
  return t('dashboard.summaryScreen.cycleOverview.cycleCount', { count: String(count) });
}

export default function SummaryCycleOverviewCard({ bundle, currency }) {
  const { t, locale } = useI18n();
  const cyclesEnabled = bundle.financials.budget?.cyclesEnabled === true;
  const cycleStore = bundle.financials.cycleStore;
  const overview = useMemo(
    () => computeSummaryCycleOverview(cycleStore),
    [cycleStore],
  );

  const activePace = useMemo(() => {
    if (!overview.activeCycle) return null;
    return computeCyclePace(
      overview.activeCycle,
      bundle.financials.dailyLogs || [],
      bundle.financials.budget,
      new Date(),
      bundle.financials.cycleAdjustments || [],
    );
  }, [overview.activeCycle, bundle.financials]);

  const counts = useMemo(
    () => computeSummaryCycleCounts(cycleStore),
    [cycleStore],
  );

  const burn = useMemo(
    () => buildCycleCountBurnRate(counts),
    [counts],
  );

  const burnAnimationKey = buildBurnAnimationKey(burn);

  const legendItems = useMemo(() => {
    const rows = [
      {
        key: 'asPlanned',
        color: C.primary,
        label: t('dashboard.summaryScreen.cycleOverview.asPlanned'),
        value: burn.asPlanned,
      },
      {
        key: 'savedMoney',
        color: C.positive,
        label: t('dashboard.summaryScreen.cycleOverview.savedMoney'),
        value: burn.savedMoney,
      },
      {
        key: 'deficit',
        color: C.danger,
        label: t('dashboard.summaryScreen.cycleOverview.deficit'),
        value: burn.deficit,
      },
    ];

    return rows.map((row) => ({
      key: row.key,
      color: row.value > 0 ? row.color : C.muted,
      label: row.label,
      amount: formatCycleCount(t, row.value),
      sharePct: burn.total > 0 ? (row.value / burn.total) * 100 : null,
    }));
  }, [burn, t]);

  const emptyMessage = cyclesEnabled && overview.elapsedCycles === 0
    ? t('dashboard.summaryScreen.cycleOverview.empty')
    : null;

  const totalDisplay = String(burn.total);

  return (
    <SurfaceCard>
      <Text style={{ ...T.cardTitle }}>{t('dashboard.summaryScreen.cycleOverview.title')}</Text>
      <Text style={{ ...T.caption, color: C.muted, marginTop: 4, marginBottom: 14 }}>
        {t('dashboard.summaryScreen.cycleOverview.helper')}
      </Text>

      <Text
        style={{
          fontSize: 36,
          lineHeight: 42,
          fontWeight: '700',
          color: C.text,
          letterSpacing: -0.02,
          ...tabularNums,
        }}
      >
        {overview.elapsedCycles}
      </Text>
      <Text style={{ ...T.caption, color: C.muted, marginTop: 4, marginBottom: 14 }}>
        {t('dashboard.summaryScreen.cycleOverview.elapsedLabel')}
      </Text>

      {emptyMessage ? (
        <DashboardSectionEmptyMessage message={emptyMessage} />
      ) : (
        <View style={{ width: '100%', marginBottom: overview.hasActiveCycle && activePace ? 14 : 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 }}>
            <BurnRateIncomePill
              label={t('dashboard.summaryScreen.cycleOverview.totalCycles')}
              amount={totalDisplay}
              animationKey={burnAnimationKey}
              tone="muted"
            />
          </View>
          <BurnRateBar
            segments={burn.segments}
            income={burn.income}
            isOvercommitted={false}
            animationKey={burnAnimationKey}
            barScale={burn.barScale ?? 1}
          />
          <BurnRateHorizontalLegend
            items={legendItems}
            animationKey={burnAnimationKey}
            amountAnimationKey={burnAnimationKey}
            spreadEvenly
          />
        </View>
      )}

      {overview.hasActiveCycle && activePace ? (
        <View style={{
          marginTop: 4,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: C.tableRowBorder,
          gap: 8,
        }}
        >
          <Text style={{ ...T.caption, color: C.muted }}>
            {t('dashboard.summaryScreen.cycleOverview.activeRange', {
              range: formatRange(overview.activeCycle, locale),
            })}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            <View>
              <Text style={{ ...T.caption, color: C.muted }}>
                {t('dashboard.summaryScreen.cycleOverview.activeBudget')}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, ...tabularNums }}>
                {formatCurrency(activePace.budgetAmount, currency)}
              </Text>
            </View>
            <View>
              <Text style={{ ...T.caption, color: C.muted }}>
                {t('dashboard.summaryScreen.cycleOverview.activeSpent')}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, ...tabularNums }}>
                {formatCurrency(activePace.spent, currency)}
              </Text>
            </View>
            <View>
              <Text style={{ ...T.caption, color: C.muted }}>
                {t('dashboard.summaryScreen.cycleOverview.activeRemaining')}
              </Text>
              <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: activePace.remaining < 0 ? C.danger : C.positive,
                ...tabularNums,
              }}
              >
                {formatCurrency(Math.max(0, activePace.remaining), currency)}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </SurfaceCard>
  );
}
