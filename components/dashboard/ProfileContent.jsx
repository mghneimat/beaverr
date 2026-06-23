import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter, useSegments } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { resolveProfileDisplayName } from '../../lib/profileDisplay';
import { navigateAppTab } from '../../lib/screenTransition';
import { C, R, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import TabSectionStack from './TabSectionStack';
import InCardSectionHeader from './InCardSectionHeader';

function ProfileLinkRow({ label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
        paddingHorizontal: 4,
        paddingVertical: 10,
        borderRadius: R.pill,
        backgroundColor: pressed || hovered ? C.overlayHover : 'transparent',
      })}
    >
      <Text style={{
        fontSize: 15,
        fontWeight: '600',
        color: C.text,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProfileContent({ bundle }) {
  const { t } = useI18n();
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  const household = bundle.financials.sections?.household;
  const displayName = resolveProfileDisplayName(household, t);

  const goTo = (route) => navigateAppTab(router, route, currentRoute);

  return (
    <TabSectionStack>
      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.profileScreen.accountTitle')} />
        <Text style={{ fontSize: 24, fontWeight: '700', color: C.primary, marginBottom: 8 }}>
          {displayName}
        </Text>
        <Text style={{ ...T.helper, color: C.muted }}>
          {t('dashboard.profileScreen.helper')}
        </Text>
      </SurfaceCard>

      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.profileScreen.preferencesTitle')} />
        <ProfileLinkRow
          label={t('dashboard.subscriptions')}
          onPress={() => goTo('subscriptions')}
        />
        <ProfileLinkRow
          label={t('dashboard.headerToolbar.accountSettings')}
          onPress={() => goTo('account-settings')}
        />
        <ProfileLinkRow
          label={t('dashboard.headerToolbar.appearance')}
          onPress={() => goTo('appearance')}
        />
        <ProfileLinkRow
          label={t('dashboard.headerToolbar.helpFeedback')}
          onPress={() => goTo('help-feedback')}
        />
      </SurfaceCard>
    </TabSectionStack>
  );
}
