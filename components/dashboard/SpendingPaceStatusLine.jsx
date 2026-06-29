import { useI18n } from '../../lib/i18n';
import {
  buildSpendingPaceMessages,
  spendingPaceMessageKey,
} from '../../lib/spendingPace';
import SpendingPaceNotice from './SpendingPaceNotice';

/**
 * Pace status block — wraps SpendingPaceNotice for ratio-based copy.
 * @param {{
 *   level?: import('../../lib/spendingPace').SpendingPaceLevel|null,
 *   color?: string,
 *   timeRatio?: number,
 *   spentRatio?: number,
 *   displaySpentRatio?: number,
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>,
 * }} props
 */
export default function SpendingPaceStatusLine({
  level,
  timeRatio,
  spentRatio,
  displaySpentRatio,
  style,
}) {
  const { t } = useI18n();
  const messageKey = spendingPaceMessageKey(level);
  const { lineMessage } = buildSpendingPaceMessages(t, {
    messageKey,
  });

  return (
    <SpendingPaceNotice
      status={level || 'good'}
      message={lineMessage}
      style={style}
    />
  );
}
