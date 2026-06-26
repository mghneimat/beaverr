import {
  getOnboardingState,
  isDashboardUnlocked,
  isQuestionnaireComplete,
  resolveBootResumeRoute,
} from '../onboardingProgress.js';
import { restoreNavHistoryForResume } from '../onboardingNavigation.js';

/**
 * Navigate after successful sign-in or sign-up (session must already be active).
 * @param {import('expo-router').Router} router
 * @param {() => Promise<{ ok: boolean, error?: string }>} pullCloudHousehold
 */
export async function navigateAfterAuth(router, pullCloudHousehold) {
  const pull = await pullCloudHousehold();
  if (!pull.ok) {
    console.warn('Cloud pull after auth failed:', pull.error);
  }

  const onboarding = await getOnboardingState();

  if (!isDashboardUnlocked(onboarding)) {
    router.replace('/(onboarding)/welcome');
    return;
  }

  if (!isQuestionnaireComplete(onboarding)) {
    const resume = resolveBootResumeRoute(onboarding);
    if (resume) {
      await restoreNavHistoryForResume(onboarding);
      router.replace(resume);
      return;
    }
  }

  router.replace('/(app)/dashboard');
}
