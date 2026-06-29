import { Text } from '@gluestack-ui/themed';
import { View } from 'react-native';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import { useIsDashboardNarrow } from '../../lib/dashboardLayout';
import { formatCurrency } from '../../lib/finance';
import { useI18n } from '../../lib/i18n';
import SurfaceCard from '../ui/SurfaceCard';
import {
  TrackerHeroMetric,
  TrackerMetricRow,
  TrackerMetricsPanel,
  TrackerPaceFooter,
  TrackerPeriodHeader,
} from './TrackerPeriodSection';

/**
 * @param {'daily'|'weekly'} period
 */
function PaceColumn({ period, data, currency, detailed }) {
  const { t } = useI18n();
  const prefix = `dashboard.trackerScreen.${period}`;
  const over = data.spent > data.allowance;
  const heroTone = over ? 'over' : data.status === 'under' ? 'under' : 'neutral';

  if (detailed) {
    return (
      <View style={{ flex: 1, minWidth: 0 }}>
        <TrackerPeriodHeader
          title={t(`${prefix}.title`)}
          helper={t(`${prefix}.helper`)}
        />
        <TrackerHeroMetric
          label={over ? t(`${prefix}.over`) : t(`${prefix}.remaining`)}
          amount={over ? data.over : data.remaining}
          currency={currency}
          tone={heroTone}
        />
        <TrackerMetricsPanel>
          <TrackerMetricRow
            label={t(`${prefix}.allowance`)}
            value={data.allowance}
            currency={currency}
          />
          <TrackerMetricRow
            label={t(`${prefix}.spent`)}
            value={data.spent}
            currency={currency}
            isLast
          />
        </TrackerMetricsPanel>
        <TrackerPaceFooter
          spendingPace={data.spendingPace}
          paceLevel={data.paceLevel}
          statusKey={`${prefix}.status.${data.status}`}
          status={data.status}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={{ ...T.cardTitle, color: C.text, marginBottom: 8 }} numberOfLines={1}>
        {t(`${prefix}.title`)}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <Text
          style={{ fontSize: 16, fontWeight: '700', color: C.text, ...tabularNums }}
          numberOfLines={1}
        >
          {formatCurrency(data.spent, currency)}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '500', color: C.muted }}>
          {' / '}
        </Text>
        <Text
          style={{ fontSize: 13, fontWeight: '500', color: C.muted, ...tabularNums }}
          numberOfLines={1}
        >
          {formatCurrency(data.allowance, currency)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', marginTop: 4, gap: 4 }}>
        <Text
          style={{
            ...T.caption,
            color: over ? C.danger : C.muted,
            fontWeight: '600',
          }}
          numberOfLines={2}
        >
          {over ? `${t(`${prefix}.over`)}:` : `${t(`${prefix}.remaining`)}:`}
        </Text>
        <Text
          style={{
            ...T.caption,
            color: over ? C.danger : C.muted,
            fontWeight: '600',
            ...tabularNums,
          }}
          numberOfLines={2}
        >
          {formatCurrency(over ? data.over : data.remaining, currency)}
        </Text>
      </View>
      <TrackerPaceFooter
        spendingPace={data.spendingPace}
        paceLevel={data.paceLevel}
        statusKey={`${prefix}.status.${data.status}`}
        status={data.status}
      />
    </View>
  );
}

/**
 * Today + this week in separate cards — side by side when wide, stacked when narrow.
 * @param {boolean} [detailed=false] — fuller metrics on the Tracker tab
 */
export default function TrackerPaceSplitCard({ previews, currency, detailed = false }) {
  const narrow = useIsDashboardNarrow();

  if (previews.mode === 'cycle') {
    return (
      <SurfaceCard style={{ marginBottom: 0 }}>
        <PaceColumn period="daily" data={previews.daily} currency={currency} detailed={detailed} />
      </SurfaceCard>
    );
  }

  return (
    <View style={{
      flexDirection: narrow ? 'column' : 'row',
      gap: 16,
      alignItems: 'stretch',
    }}
    >
      <SurfaceCard style={{ flex: narrow ? undefined : 1, marginBottom: 0 }}>
        <PaceColumn period="daily" data={previews.daily} currency={currency} detailed={detailed} />
      </SurfaceCard>
      <SurfaceCard style={{ flex: narrow ? undefined : 1, marginBottom: 0 }}>
        <PaceColumn period="weekly" data={previews.weekly} currency={currency} detailed={detailed} />
      </SurfaceCard>
    </View>
  );
}
