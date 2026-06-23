import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../../constants/onboarding-theme';
import { useI18n } from '../../../lib/i18n';
import { InfoIcon } from '../../app/AppNavIcons';
import AnimatedCollapse from '../AnimatedCollapse';

const INFO_SIZE = 16;
const INFO_HIT = 28;

/**
 * Explains cycle math while the user is logging past days.
 * @param {{ visible: boolean, style?: import('react-native').StyleProp<import('react-native').ViewStyle> }} props
 */
export default function CycleBackfillInfoBanner({ visible, style }) {
  const { t } = useI18n();

  return (
    <AnimatedCollapse
      visible={visible}
      fallbackHeight={72}
      style={style}
    >
      <View
        accessibilityRole="text"
        accessibilityLabel={t('dashboard.cycles.backfill.bannerA11y')}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          backgroundColor: C.surfaceTint,
          borderRadius: R.input,
          padding: 12,
        }}
      >
        <View
          style={{
            width: INFO_HIT,
            height: INFO_HIT,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <InfoIcon color={C.primary} size={INFO_SIZE} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...T.caption, color: C.primary, lineHeight: 20, fontWeight: '600' }}>
            {t('dashboard.cycles.backfill.bannerTitle')}
          </Text>
          <Text style={{ ...T.caption, color: C.muted, marginTop: 4, lineHeight: 18 }}>
            {t('dashboard.cycles.backfill.bannerBody')}
          </Text>
        </View>
      </View>
    </AnimatedCollapse>
  );
}
