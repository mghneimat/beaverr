import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import TabSectionStack from './TabSectionStack';

export default function HelpFeedbackContent() {
  const { t } = useI18n();

  return (
    <TabSectionStack>
      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.helpFeedback')} />
        <Text style={{ ...T.helper, color: C.muted }}>
          {t('dashboard.helpFeedbackScreen.helper')}
        </Text>
      </SurfaceCard>
    </TabSectionStack>
  );
}
