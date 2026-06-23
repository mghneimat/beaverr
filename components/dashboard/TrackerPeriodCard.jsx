import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import AnimatedCollapse from './AnimatedCollapse';
import SpendingPaceStatusLine from './SpendingPaceStatusLine';
import { formatCurrency } from '../../lib/finance';

const STATUS_COLORS = {
  under: C.positive,
  on_track: C.primary,
  over: C.danger,
};

function destinationLabel(t, monthlyPreview, currency) {
  const { route, strategy, resetDestination, otherGoalNote } = monthlyPreview;
  if (strategy === 'free' || strategy === 'capped') {
    return t('dashboard.trackerScreen.monthly.route.rolloverFree');
  }
  if (resetDestination === 'savings') {
    return t('dashboard.trackerScreen.monthly.route.savings');
  }
  if (resetDestination === 'otherGoal') {
    return t('dashboard.trackerScreen.monthly.route.otherGoal', {
      name: otherGoalNote || t('dashboard.savingsScreen.otherGoalFallback'),
    });
  }
  return t('dashboard.trackerScreen.monthly.route.looseMoney');
}

function MetricRow({ label, value, currency, emphasize }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ ...T.helper, flex: 1, paddingRight: 8 }}>{label}</Text>
      <Text
        style={{
          ...T.helper,
          fontWeight: emphasize ? '700' : '600',
          fontSize: emphasize ? 18 : 14,
          ...tabularNums,
        }}
      >
        {formatCurrency(value, currency)}
      </Text>
    </View>
  );
}

/**
 * @param {'daily'|'weekly'|'monthly'} period
 */
export default function TrackerPeriodCard({ period, previews, currency }) {
  const { t } = useI18n();
  const prefix = `dashboard.trackerScreen.${period}`;

  if (period === 'monthly') {
    const preview = previews.monthly;
    const routeLabel = destinationLabel(t, preview, currency);

    return (
      <SurfaceCard>
        <Text style={{ ...T.cardTitle }}>{t(`${prefix}.title`)}</Text>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>
          {t(`${prefix}.helper`)}
        </Text>

        <View style={{ marginTop: 16, gap: 10 }}>
          <MetricRow
            label={t(`${prefix}.spentSoFar`)}
            value={preview.spentSoFar}
            currency={currency}
          />
          <MetricRow
            label={t(`${prefix}.projectedLeftover`)}
            value={preview.projectedLeftover}
            currency={currency}
            emphasize
          />
        </View>

        <AnimatedCollapse visible={preview.projectedLeftover > 0} fallbackHeight={72}>
          <View
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              backgroundColor: C.infoWashBg,
            }}
          >
            <Text style={{ ...T.caption, color: C.muted }}>{t(`${prefix}.goesTo`)}</Text>
            <Text style={{ ...T.helper, fontWeight: '600', color: C.primary, marginTop: 4 }}>
              {routeLabel}
            </Text>
          </View>
        </AnimatedCollapse>
        <AnimatedCollapse visible={preview.projectedLeftover <= 0} fallbackHeight={24}>
          <Text style={{ ...T.helper, color: C.muted, marginTop: 16 }}>
            {t(`${prefix}.noLeftover`)}
          </Text>
        </AnimatedCollapse>
        {preview.spendingPace ? (
          <View style={{ marginTop: 16 }}>
            <SpendingPaceStatusLine
              level={preview.paceLevel}
              color={preview.paceColor}
              timeRatio={preview.spendingPace.timeRatio}
              spentRatio={preview.spendingPace.spentRatio}
              style={{ marginTop: 0 }}
            />
          </View>
        ) : null}
      </SurfaceCard>
    );
  }

  const data = previews[period];
  const statusColor = STATUS_COLORS[data.status] || C.primary;

  return (
    <SurfaceCard>
      <Text style={{ ...T.cardTitle }}>{t(`${prefix}.title`)}</Text>
      <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>
        {t(`${prefix}.helper`)}
      </Text>

      <View style={{ marginTop: 16, gap: 10 }}>
        <MetricRow
          label={t(`${prefix}.allowance`)}
          value={data.allowance}
          currency={currency}
        />
        <MetricRow
          label={t(`${prefix}.spent`)}
          value={data.spent}
          currency={currency}
        />
        <AnimatedCollapse visible={data.over > 0} fallbackHeight={28}>
          <MetricRow
            label={t(`${prefix}.over`)}
            value={data.over}
            currency={currency}
            emphasize
          />
        </AnimatedCollapse>
        <AnimatedCollapse visible={data.over <= 0} fallbackHeight={28}>
          <MetricRow
            label={t(`${prefix}.remaining`)}
            value={data.remaining}
            currency={currency}
            emphasize
          />
        </AnimatedCollapse>
      </View>

      <View
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          backgroundColor: C.infoWashBg,
        }}
      >
        {data.spendingPace ? (
          <SpendingPaceStatusLine
            level={data.paceLevel}
            color={data.paceColor}
            timeRatio={data.spendingPace.timeRatio}
            spentRatio={data.spendingPace.spentRatio}
            style={{ marginTop: 0 }}
          />
        ) : (
          <Text style={{ ...T.helper, fontWeight: '600', color: statusColor }}>
            {t(`${prefix}.status.${data.status}`)}
          </Text>
        )}
      </View>

      <AnimatedCollapse visible={!data.hasLogs} fallbackHeight={20}>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 12 }}>
          {t('dashboard.trackerScreen.noSpendLogged')}
        </Text>
      </AnimatedCollapse>
    </SurfaceCard>
  );
}
