import { Text } from '@gluestack-ui/themed';
import { View } from 'react-native';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import { useIsDashboardNarrow } from '../../lib/dashboardLayout';
import { formatCurrency } from '../../lib/finance';
import { useI18n } from '../../lib/i18n';
import SurfaceCard from '../ui/SurfaceCard';
import AnimatedCollapse from './AnimatedCollapse';
import SpendingPaceStatusLine from './SpendingPaceStatusLine';
import { shouldShowSpendingPaceStatus } from '../../lib/spendingPace';

const STATUS_COLORS = {
  under: C.positive,
  on_track: C.primary,
  over: C.danger,
};

function DetailMetric({ label, value, currency }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <Text style={{ ...T.caption, color: C.muted, flex: 1 }} numberOfLines={2}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', ...tabularNums }} numberOfLines={1}>
        {formatCurrency(value, currency)}
      </Text>
    </View>
  );
}

/**
 * @param {'daily'|'weekly'} period
 */
function PaceColumn({ period, data, currency, detailed }) {
  const { t } = useI18n();
  const prefix = `dashboard.trackerScreen.${period}`;
  const statusColor = data.paceColor || STATUS_COLORS[data.status] || C.primary;
  const over = data.spent > data.allowance;
  const noLogsKey = period === 'daily'
    ? 'dashboard.home.trackerSnapshot.noLogsDaily'
    : 'dashboard.home.trackerSnapshot.noLogsWeekly';

  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={{ ...T.cardTitle, marginBottom: detailed ? 4 : 8 }} numberOfLines={1}>
        {t(`${prefix}.title`)}
      </Text>
      {detailed ? (
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }} numberOfLines={3}>
          {t(`${prefix}.helper`)}
        </Text>
      ) : null}

      {detailed ? (
        <View style={{ gap: 8 }}>
          <DetailMetric
            label={t(`${prefix}.allowance`)}
            value={data.allowance}
            currency={currency}
          />
          <DetailMetric
            label={t(`${prefix}.spent`)}
            value={data.spent}
            currency={currency}
          />
          <DetailMetric
            label={over ? t(`${prefix}.over`) : t(`${prefix}.remaining`)}
            value={over ? data.over : data.remaining}
            currency={currency}
          />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.primary, ...tabularNums }} numberOfLines={1}>
              {formatCurrency(data.spent, currency)}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: C.muted }}>
              {' / '}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: C.muted, ...tabularNums }} numberOfLines={1}>
              {formatCurrency(data.allowance, currency)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', marginTop: 4, gap: 4 }}>
            <Text style={{ ...T.caption, color: over ? C.danger : C.muted, fontWeight: '600' }} numberOfLines={2}>
              {over ? `${t(`${prefix}.over`)}:` : `${t(`${prefix}.remaining`)}:`}
            </Text>
            <Text style={{ ...T.caption, color: over ? C.danger : C.muted, fontWeight: '600', ...tabularNums }} numberOfLines={2}>
              {formatCurrency(over ? data.over : data.remaining, currency)}
            </Text>
          </View>
        </>
      )}

      {data.paceLevel && data.spendingPace ? (
        <SpendingPaceStatusLine
          level={data.paceLevel}
          color={statusColor}
          timeRatio={data.spendingPace.timeRatio}
          spentRatio={data.spendingPace.spentRatio}
          style={{ marginTop: detailed ? 12 : 10 }}
        />
      ) : (
        <Text style={{ ...T.caption, color: statusColor, marginTop: detailed ? 12 : 10, fontWeight: '600' }}>
          {t(`${prefix}.status.${data.status}`)}
        </Text>
      )}
      <AnimatedCollapse visible={!data.hasLogs} fallbackHeight={20}>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }} numberOfLines={3}>
          {t(noLogsKey)}
        </Text>
      </AnimatedCollapse>
    </View>
  );
}

function PeriodPaceBanner({ periodPace }) {
  if (!periodPace) return null;
  return (
    <View style={{ marginBottom: 12 }}>
      <SpendingPaceStatusLine
        level={periodPace.level}
        color={periodPace.color}
        timeRatio={periodPace.timeRatio}
        spentRatio={periodPace.spentRatio}
        displaySpentRatio={periodPace.displaySpentRatio}
        style={{ marginTop: 0 }}
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
  const backfillPending = previews.mode === 'cycle' && (previews.unsetDays?.length ?? 0) > 0;

  if (previews.mode === 'cycle') {
    return (
      <SurfaceCard style={{ marginBottom: 0 }}>
        {shouldShowSpendingPaceStatus(previews.periodPace?.level, backfillPending) ? (
          <PeriodPaceBanner periodPace={previews.periodPace} />
        ) : null}
        <PaceColumn period="daily" data={previews.daily} currency={currency} detailed={detailed} />
      </SurfaceCard>
    );
  }

  return (
    <View style={{
      flexDirection: narrow ? 'column' : 'row',
      gap: 16,
      alignItems: 'stretch',
    }}>
      <SurfaceCard style={{ flex: narrow ? undefined : 1, marginBottom: 0 }}>
        <PeriodPaceBanner periodPace={previews.periodPace} />
        <PaceColumn period="daily" data={previews.daily} currency={currency} detailed={detailed} />
      </SurfaceCard>
      <SurfaceCard style={{ flex: narrow ? undefined : 1, marginBottom: 0 }}>
        <PaceColumn period="weekly" data={previews.weekly} currency={currency} detailed={detailed} />
      </SurfaceCard>
    </View>
  );
}
