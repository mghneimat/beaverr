import { useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import OptionCard from '../ui/OptionCard';
import TabSectionStack from './TabSectionStack';
import InCardSectionHeader from './InCardSectionHeader';
import { Text } from '@gluestack-ui/themed';

export default function AppearanceContent() {
  const { t } = useI18n();
  const { mode, setMode } = useTheme();

  return (
    <TabSectionStack>
      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.appearance.title')} />
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('dashboard.appearance.helper')}
        </Text>

        <OptionCard
          label={t('dashboard.appearance.light')}
          subtitle={t('dashboard.appearance.lightDescription')}
          selected={mode === 'light'}
          onPress={() => setMode('light')}
        />
        <OptionCard
          label={t('dashboard.appearance.dark')}
          subtitle={t('dashboard.appearance.darkDescription')}
          selected={mode === 'dark'}
          onPress={() => setMode('dark')}
        />
      </SurfaceCard>
    </TabSectionStack>
  );
}
