import { InfoIcon } from '../app/AppNavIcons';
import DashboardTintedNotice from './DashboardTintedNotice';

/**
 * Month-end leftover routing callout on the tracker monthly card.
 * @param {{
 *   eyebrow: string,
 *   destinationLabel: string,
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>,
 * }} props
 */
export default function TrackerRouteNotice({
  eyebrow,
  destinationLabel,
  style,
}) {
  return (
    <DashboardTintedNotice
      variant="info"
      eyebrow={eyebrow}
      title={destinationLabel}
      Icon={InfoIcon}
      style={style}
    />
  );
}
