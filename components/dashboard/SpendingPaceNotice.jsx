import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';
import { spendingPaceBannerTheme } from '../../lib/spendingPace';
import { InfoIcon } from '../app/AppNavIcons';
import DashboardTintedNotice from './DashboardTintedNotice';

/**
 * Tinted spending-pace notice — shared by top banners and in-card tracker footers.
 * @param {{
 *   status: import('../../lib/spendingPace').SpendingPaceBannerStatus,
 *   message: string,
 *   showIcon?: boolean,
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>,
 * }} props
 */
export default function SpendingPaceNotice({
  status,
  message,
  showIcon = true,
  style,
}) {
  const bannerTheme = spendingPaceBannerTheme(status);

  return (
    <DashboardTintedNotice
      theme={{
        backgroundColor: bannerTheme.backgroundColor,
        borderColor: bannerTheme.borderColor,
        eyebrowColor: bannerTheme.textColor,
        titleColor: bannerTheme.textColor,
        messageColor: bannerTheme.textColor,
        iconColor: bannerTheme.iconColor,
      }}
      message={message}
      Icon={showIcon ? InfoIcon : null}
      style={style}
    />
  );
}
