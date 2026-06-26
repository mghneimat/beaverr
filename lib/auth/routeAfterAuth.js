import { resolveBootRouteWithProfile } from './bootRouting.js';
import { navigateAfterAuth } from './navigateAfterAuth.js';
import { getOnboardingState } from '../onboardingProgress.js';

/**
 * Route after any successful auth (email, OAuth). Checks profile username before onboarding.
 * @param {import('expo-router').Router} router
 * @param {() => Promise<{ ok: boolean, error?: string }>} pullCloudHousehold
 * @param {string} userId
 */
export async function routeAfterAuth(router, pullCloudHousehold, userId) {
  const onboarding = await getOnboardingState();
  const route = await resolveBootRouteWithProfile({
    hasSession: true,
    supabaseConfigured: true,
    userId,
    onboarding,
  });

  if (route === 'auth_complete_profile') {
    router.replace('/(auth)/complete-profile');
    return;
  }

  await navigateAfterAuth(router, pullCloudHousehold);
}
