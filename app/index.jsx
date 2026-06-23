import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getOnboardingState, isDashboardUnlocked, isQuestionnaireComplete, getSavedResumeRoute } from '../lib/onboardingProgress';
import { restoreNavHistoryForResume } from '../lib/onboardingNavigation';
import { ensureStorageMigrated } from '../lib/storage';
import { useI18n } from '../lib/i18n';
import AppLoadingScreen from '../components/app/AppLoadingScreen';

export default function Index() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    async function checkOnboarding() {
      try {
        await ensureStorageMigrated();
        const onboarding = await getOnboardingState();
        
        if (isDashboardUnlocked(onboarding)) {
          if (!isQuestionnaireComplete(onboarding)) {
            const resume = getSavedResumeRoute(onboarding);
            if (resume?.startsWith('/(onboarding)')) {
              await restoreNavHistoryForResume(onboarding);
              router.replace(resume);
              return;
            }
          }
          router.replace('/(app)/dashboard');
        } else {
          router.replace('/(onboarding)/welcome');
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        router.replace('/(onboarding)/welcome');
      }
    }

    checkOnboarding();
  }, []);

  return <AppLoadingScreen label={t('common.loading')} />;
}
