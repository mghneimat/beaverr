import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { restoreNavHistoryForResume } from '../lib/onboardingNavigation';
import { getOnboardingState, resolveBootResumeRoute } from '../lib/onboardingProgress';
import { resolveBootRouteWithProfile } from '../lib/auth/bootRouting';
import { useAuth } from '../lib/auth/AuthProvider';
import { ensureStorageMigrated } from '../lib/storage';
import { useI18n } from '../lib/i18n';
import AppLoadingScreen from '../components/app/AppLoadingScreen';
import { C, S, T } from '../constants/onboarding-theme';

export default function Index() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, loading, configured, pullCloudHousehold } = useAuth();
  const [bootError, setBootError] = useState('');

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        await ensureStorageMigrated();
        if (loading) return;

        const onboarding = await getOnboardingState();
        const route = await resolveBootRouteWithProfile({
          hasSession: Boolean(session),
          supabaseConfigured: configured,
          userId: session?.user?.id,
          onboarding,
        });

        if (route === 'auth_required_misconfig') {
          if (active) setBootError(t('auth.errors.misconfigured'));
          return;
        }

        if (route === 'auth_welcome') {
          router.replace('/(auth)/welcome');
          return;
        }

        if (route === 'auth_complete_profile') {
          router.replace('/(auth)/complete-profile');
          return;
        }

        const pull = await pullCloudHousehold();
        if (!pull.ok && active) {
          console.warn('Boot cloud pull failed:', pull.error);
        }

        if (route === 'onboarding_welcome') {
          router.replace('/(onboarding)/welcome');
          return;
        }

        if (route === 'onboarding_resume') {
          const resume = resolveBootResumeRoute(onboarding);
          if (resume) {
            await restoreNavHistoryForResume(onboarding);
            router.replace(resume);
            return;
          }
        }

        router.replace('/(app)/dashboard');
      } catch (error) {
        console.error('Boot routing failed:', error);
        if (active) {
          router.replace(configured && session ? '/(onboarding)/welcome' : '/(auth)/welcome');
        }
      }
    }

    boot();

    return () => {
      active = false;
    };
  }, [loading, session, configured, router, pullCloudHousehold, t]);

  if (bootError) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
        <Text style={{ ...T.helper, color: C.danger, textAlign: 'center' }}>{bootError}</Text>
      </View>
    );
  }

  return <AppLoadingScreen label={t('common.loading')} />;
}
