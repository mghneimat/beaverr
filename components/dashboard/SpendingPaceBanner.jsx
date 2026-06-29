import { useI18n } from '../../lib/i18n';
import {
  resolveSpendingPaceBanner,
  buildSpendingPaceMessages,
} from '../../lib/spendingPace';
import AnimatedBannerShell from './AnimatedBannerShell';
import SpendingPaceNotice from './SpendingPaceNotice';

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

  const { lineMessage } = buildSpendingPaceMessages(t, {
    messageKey: banner.messageKey,
    backfillNote: banner.showBackfillNote,
  });

  return (
    <AnimatedBannerShell
      visible={banner.visible}
      fallbackHeight={52}
      style={style}
    >
      <SpendingPaceNotice
        status={banner.status}
        message={lineMessage}
      />
    </AnimatedBannerShell>
  );
}
