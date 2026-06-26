/**
 * Confirm before leaving onboarding back to the dashboard.
 */

import { isDashboardUnlocked } from './onboardingProgress';

/** Routes where back/exit may leave onboarding for the dashboard. */
export const LEAVE_TO_DASHBOARD_ROUTES = new Set([
  '/(onboarding)/welcome',
  '/(onboarding)/setup-mode',
]);

/**
 * @param {string} route
 * @returns {boolean}
 */
export function isLeaveToDashboardRoute(route) {
  return LEAVE_TO_DASHBOARD_ROUTES.has(route);
}

/**
 * @param {import('./schema').OnboardingState|null|undefined} state
 * @param {string} [route]
 * @returns {boolean}
 */
export function shouldConfirmLeaveToDashboard(state, route) {
  if (!isDashboardUnlocked(state)) return false;
  if (!route) return true;
  return isLeaveToDashboardRoute(route);
}
