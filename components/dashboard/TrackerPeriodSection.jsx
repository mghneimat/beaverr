import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import { formatCurrency } from '../../lib/finance';
import { useI18n } from '../../lib/i18n';
import { MaytechTableFrame } from './BreakdownTablePrimitives';
import SpendingPaceNotice from './SpendingPaceNotice';
import SpendingPaceStatusLine from './SpendingPaceStatusLine';

/**
 * @param {'under'|'on_track'|'over'|string} status
 */
export function trackerStatusColor(status) {
  if (status === 'under') return C.positive;
  if (status === 'over') return C.danger;
  return C.text;
}

export function TrackerPeriodHeader({ title, helper }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ ...T.cardTitle, color: C.text }} numberOfLines={1}>
        {title}
      </Text>
      {helper ? (
        <Text
          style={{ ...T.caption, color: C.muted, marginTop: 4, lineHeight: 18 }}
          numberOfLines={3}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * @param {'neutral'|'under'|'over'} [tone]
 */
export function TrackerHeroMetric({ label, amount, currency, tone = 'neutral' }) {
  const color = tone === 'over'
    ? C.danger
    : tone === 'under'
      ? C.positive
      : C.text;

  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 28,
          lineHeight: 34,
          fontWeight: '700',
          color,
          letterSpacing: -0.02,
          ...tabularNums,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {formatCurrency(amount, currency)}
      </Text>
      <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function TrackerMetricsPanel({ children }) {
  return (
    <MaytechTableFrame>
      {children}
    </MaytechTableFrame>
  );
}

export function TrackerMetricRow({ label, value, currency, isLast = false }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: C.surface,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: C.tableRowBorder,
      }}
    >
      <Text
        style={{
          flex: 1,
          flexBasis: 0,
          fontSize: 15,
          fontWeight: '500',
          color: C.text,
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: C.primary,
          flexShrink: 0,
          ...tabularNums,
        }}
        numberOfLines={1}
      >
        {formatCurrency(value, currency)}
      </Text>
    </View>
  );
}

/**
 * @param {'under'|'on_track'|'over'|string} status
 * @returns {import('../../lib/spendingPace').SpendingPaceBannerStatus}
 */
function trackerPaceBannerStatus(status) {
  if (status === 'over') return 'critical';
  return 'good';
}

/**
 * @param {{
 *   spendingPace?: object|null,
 *   paceLevel?: string|null,
 *   statusKey?: string,
 *   status?: string,
 * }} props
 */
export function TrackerPaceFooter({
  spendingPace,
  paceLevel,
  statusKey,
  status,
}) {
  const { t } = useI18n();

  if (spendingPace && paceLevel) {
    return (
      <SpendingPaceStatusLine
        level={paceLevel}
        timeRatio={spendingPace.timeRatio}
        spentRatio={spendingPace.spentRatio}
        displaySpentRatio={spendingPace.displaySpentRatio}
        style={{ marginTop: 14 }}
      />
    );
  }

  if (statusKey) {
    return (
      <SpendingPaceNotice
        status={trackerPaceBannerStatus(status)}
        message={t(statusKey)}
        style={{ marginTop: 14 }}
      />
    );
  }

  return null;
}
