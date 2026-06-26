import {
  getOnboardingState,
  isDashboardUnlocked,
  isQuestionnaireComplete,
  resolveBootResumeRoute,
} from '../onboardingProgress.js';
import { hasCompletedProfile } from './profileGate.js';

/**
 * @param {{
 *   hasSession: boolean,
 *   supabaseConfigured: boolean,
 *   onboarding?: object | null,
 * }} input
 * @returns {'auth_welcome' | 'auth_required_misconfig' | 'onboarding_welcome' | 'onboarding_resume' | 'dashboard'}
 */
export function resolveBootRoute({ hasSession, supabaseConfigured, onboarding }) {
  if (!supabaseConfigured) {
    return 'auth_required_misconfig';
  }
  if (!hasSession) {
    return 'auth_welcome';
  }

  const state = onboarding ?? null;
  if (!isDashboardUnlocked(state)) {
    return 'onboarding_welcome';
  }

  if (!isQuestionnaireComplete(state)) {
    const resume = resolveBootResumeRoute(state);
    if (resume) {
      return 'onboarding_resume';
    }
  }

  return 'dashboard';
}

/**
 * Boot route when session exists — gates OAuth users without a claimed username.
 * @param {{
 *   hasSession: boolean,
 *   supabaseConfigured: boolean,
 *   userId?: string,
 *   onboarding?: object | null,
 * }} input
 * @returns {Promise<'auth_welcome' | 'auth_required_misconfig' | 'auth_complete_profile' | 'onboarding_welcome' | 'onboarding_resume' | 'dashboard'>}
 */
export async function resolveBootRouteWithProfile({
  hasSession,
  supabaseConfigured,
  userId,
  onboarding,
}) {
  if (!supabaseConfigured) {
    return 'auth_required_misconfig';
  }
  if (!hasSession) {
    return 'auth_welcome';
  }

  if (userId) {
    const complete = await hasCompletedProfile(userId);
    if (!complete) {
      return 'auth_complete_profile';
    }
  }

  return resolveBootRoute({ hasSession, supabaseConfigured, onboarding });
}

/**
 * @param {object} [onboarding]
 * @returns {Promise<object|null>}
 */
export async function loadBootOnboardingState(onboarding) {
  if (onboarding !== undefined) {
    return onboarding;
  }
  return getOnboardingState();
}
