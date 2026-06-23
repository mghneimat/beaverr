import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { R, T } from '../../constants/onboarding-theme';
import { useI18n } from '../../lib/i18n';
import {
  formatSpendingPacePercent,
  resolveSpendingPaceBanner,
  spendingPaceBannerTheme,
  spendingPaceDisplaySpentRatio,
} from '../../lib/spendingPace';
import { InfoIcon } from '../app/AppNavIcons';
import AnimatedBannerShell from './AnimatedBannerShell';

const INFO_SIZE = 16;

/**
 * Top-of-screen spending pace / backfill banner.
 * Pace warnings stay visible during backfill; backfill-only copy when still on plan.
 * @param {{
 *   backfillPending?: boolean,
 *   periodPace?: {
 *     level?: import('../../lib/spendingPace').SpendingPaceLevel|null,
 *     timeRatio?: number,
 *     spentRatio?: number,
 *     displaySpentRatio?: number,
 *     scope?: string,
 *   }|null,
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>,
 * }} props
 */
export default function SpendingPaceBanner({
  backfillPending = false,
  periodPace = null,
  style,
}) {
  const { t } = useI18n();
  const banner = resolveSpendingPaceBanner({
    backfillPending,
    level: periodPace?.level,
    timeRatio: periodPace?.timeRatio,
    spentRatio: periodPace?.spentRatio,
    scope: periodPace?.scope,
  });

  if (!banner.visible) return null;

  const theme = spendingPaceBannerTheme(banner.status);
  const primaryMessage = t(`dashboard.spendingPace.${banner.messageKey}`);
  const detailMessage = banner.showDetail
    ? t('dashboard.spendingPace.detail', {
      spentPct: formatSpendingPacePercent(spendingPaceDisplaySpentRatio(periodPace)),
      timePct: formatSpendingPacePercent(periodPace?.timeRatio ?? 0),
    })
    : null;
  const backfillNote = banner.showBackfillNote
    ? t('dashboard.spendingPace.backfillPendingNote')
    : null;
  const a11yLabel = [primaryMessage, detailMessage, backfillNote].filter(Boolean).join('. ');

  return (
    <AnimatedBannerShell
      visible={banner.visible}
      fallbackHeight={banner.showDetail || backfillNote ? 72 : 52}
      style={style}
    >
      <View
        accessibilityRole="text"
        accessibilityLabel={a11yLabel}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          gap: 8,
          backgroundColor: theme.backgroundColor,
          borderWidth: 1,
          borderColor: theme.borderColor,
          borderRadius: R.input,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        <InfoIcon color={theme.iconColor} size={INFO_SIZE} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              ...T.caption,
              color: theme.textColor,
              lineHeight: 20,
              fontWeight: '600',
              textAlign: 'left',
            }}
          >
            {primaryMessage}
          </Text>
          {detailMessage ? (
            <Text
              style={{
                ...T.caption,
                color: theme.textColor,
                lineHeight: 18,
                marginTop: 4,
                opacity: 0.9,
                textAlign: 'left',
              }}
            >
              {detailMessage}
            </Text>
          ) : null}
          {backfillNote ? (
            <Text
              style={{
                ...T.caption,
                color: theme.textColor,
                lineHeight: 18,
                marginTop: detailMessage ? 4 : 4,
                opacity: 0.85,
                textAlign: 'left',
              }}
            >
              {backfillNote}
            </Text>
          ) : null}
        </View>
      </View>
    </AnimatedBannerShell>
  );
}
