import { useRouter, useSegments } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { useI18n } from '../../lib/i18n';
import { navigateAppTab } from '../../lib/screenTransition';
import SurfaceCard from '../ui/SurfaceCard';
import TabSectionStack from './TabSectionStack';
import InCardSectionHeader from './InCardSectionHeader';
import CardActionRow from './CardActionRow';
import ProfileAccountForm from './ProfileAccountForm';

export default function ProfileContent() {
  const { t } = useI18n();
  const { toggleMode, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];

  const goTo = (route) => navigateAppTab(router, route, currentRoute);

  return (
    <TabSectionStack>
      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.profileScreen.accountTitle')} />
        <ProfileAccountForm />
      </SurfaceCard>

      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.profileScreen.preferencesTitle')} />
        <CardActionRow
          label={t('dashboard.subscriptions')}
          onPress={() => goTo('subscriptions')}
        />
        <CardActionRow
          label={t('dashboard.headerToolbar.accountSettings')}
          onPress={() => goTo('account-settings')}
        />
        <CardActionRow
          label={t('dashboard.headerToolbar.appearance')}
          onPress={toggleMode}
          accessibilityLabel={isDark
            ? t('dashboard.headerToolbar.appearanceSwitchToLight')
            : t('dashboard.headerToolbar.appearanceSwitchToDark')}
        />
        <CardActionRow
          label={t('dashboard.headerToolbar.helpFeedback')}
          onPress={() => goTo('help-feedback')}
        />
      </SurfaceCard>
    </TabSectionStack>
  );
}
