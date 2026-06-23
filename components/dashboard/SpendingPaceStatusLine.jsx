import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import {
  formatSpendingPacePercent,
  spendingPaceMessageKey,
  spendingPaceDisplaySpentRatio,
} from '../../lib/spendingPace';
import { T } from '../../constants/onboarding-theme';

/**
 * Cycle / period spending pace status line with optional detail.
 * @param {{
 *   level?: import('../../lib/spendingPace').SpendingPaceLevel|null,
 *   color: string,
 *   timeRatio?: number,
 *   spentRatio?: number,
 *   displaySpentRatio?: number,
 *   style?: object,
 * }} props
 */
export default function SpendingPaceStatusLine({
  level,
  color,
  timeRatio,
  spentRatio,
  displaySpentRatio,
  style,
}) {
  const { t } = useI18n();
  const messageKey = spendingPaceMessageKey(level);
  const spentPct = spendingPaceDisplaySpentRatio({ spentRatio, displaySpentRatio });

  return (
    <>
      <Text style={{ ...T.caption, color, marginTop: 4, fontWeight: '600', ...style }}>
        {t(`dashboard.spendingPace.${messageKey}`)}
      </Text>
      {timeRatio != null && (spentRatio != null || displaySpentRatio != null) ? (
        <Text style={{ ...T.caption, color, marginTop: 4, opacity: 0.85 }}>
          {t('dashboard.spendingPace.detail', {
            spentPct: formatSpendingPacePercent(spentPct),
            timePct: formatSpendingPacePercent(timeRatio),
          })}
        </Text>
      ) : null}
    </>
  );
}
