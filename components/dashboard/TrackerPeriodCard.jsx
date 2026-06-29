import { Text } from '@gluestack-ui/themed';import { useI18n } from '../../lib/i18n';
import { formatMonthEndDestination } from '../../lib/monthEndLabels';
import { C, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import AnimatedCollapse from './AnimatedCollapse';
import TrackerRouteNotice from './TrackerRouteNotice';
import {
  TrackerHeroMetric,
  TrackerMetricRow,
  TrackerMetricsPanel,
  TrackerPaceFooter,
  TrackerPeriodHeader,
} from './TrackerPeriodSection';

/**
 * @param {'daily'|'weekly'|'monthly'} period
 */
export default function TrackerPeriodCard({ period, previews, currency }) {
  const { t } = useI18n();
  const prefix = `dashboard.trackerScreen.${period}`;

  if (period === 'monthly') {
    const preview = previews.monthly;
    const routeLabel = formatMonthEndDestination(t, preview, currency);

    return (
      <SurfaceCard>
        <TrackerPeriodHeader
          title={t(`${prefix}.title`)}
          helper={t(`${prefix}.helper`)}
        />
        <TrackerHeroMetric
          label={t(`${prefix}.projectedLeftover`)}
          amount={preview.projectedLeftover}
          currency={currency}
          tone={preview.projectedLeftover > 0 ? 'under' : 'neutral'}
        />
        <TrackerMetricsPanel>
          <TrackerMetricRow
            label={t(`${prefix}.spentSoFar`)}
            value={preview.spentSoFar}
            currency={currency}
            isLast
          />
        </TrackerMetricsPanel>

        <AnimatedCollapse visible={preview.projectedLeftover > 0} fallbackHeight={56}>
          <TrackerRouteNotice
            eyebrow={t(`${prefix}.goesTo`)}
            destinationLabel={routeLabel}
            style={{ marginTop: 14 }}
          />
        </AnimatedCollapse>
        <AnimatedCollapse visible={preview.projectedLeftover <= 0} fallbackHeight={24}>
          <Text style={{ ...T.caption, color: C.muted, marginTop: 14, lineHeight: 18 }}>
            {t(`${prefix}.noLeftover`)}
          </Text>
        </AnimatedCollapse>

        <TrackerPaceFooter
          spendingPace={preview.spendingPace}
          paceLevel={preview.paceLevel}
        />
      </SurfaceCard>
    );
  }

  const data = previews[period];

  return (
    <SurfaceCard>
      <TrackerPeriodHeader
        title={t(`${prefix}.title`)}
        helper={t(`${prefix}.helper`)}
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
        />
        <TrackerMetricRow
          label={data.over > 0 ? t(`${prefix}.over`) : t(`${prefix}.remaining`)}
          value={data.over > 0 ? data.over : data.remaining}
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
    </SurfaceCard>
  );
}
