import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import TabSectionStack from './TabSectionStack';
import { ZapIcon } from '../app/AppNavIcons';

function ProPlanBadge({ t }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: R.pill,
      backgroundColor: C.heroIncomeBg,
      borderWidth: 1,
      borderColor: C.heroIncomeBorder,
    }}>
      <ZapIcon color={C.heroIncomeBadge} size={12} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: C.heroIncomeBadge, letterSpacing: 0.4 }}>
        {t('dashboard.headerToolbar.proBadge')}
      </Text>
    </View>
  );
}

export default function SubscriptionsContent() {
  const { t } = useI18n();

  return (
    <TabSectionStack>
      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.subscriptions')} />
        <ProPlanBadge t={t} />
        <Text style={{ ...T.helper, color: C.muted, marginTop: 12 }}>
          {t('dashboard.subscriptionsScreen.helper')}
        </Text>
      </SurfaceCard>
    </TabSectionStack>
  );
}
