import { encodeStashRouteId } from './stashRoutes';

/** @typedef {'forward' | 'back' | 'lateral' | 'detail' | 'detailBack' | 'none'} ScreenTransitionDirection */

/** @type {ScreenTransitionDirection} */
let pendingDirection = 'none';

/** @type {Set<string>} */
const APP_TAB_ROUTE_NAMES = new Set([
  'dashboard',
  'income',
  'costs',
  'budget',
  'goals',
  'savings',
  'summary',
  'alerts',
  'tracker',
  'subscriptions',
  'profile',
  'account-settings',
  'appearance',
  'help-feedback',
]);

/**
 * Resolve sidebar active tab from Expo Router segments (nested detail routes included).
 * @param {readonly string[]|string[]} segments
 * @returns {string}
 */
export function resolveActiveAppTab(segments) {
  const segs = Array.isArray(segments) ? segments : [];
  if (segs.includes('reduce-costs')) return 'goals';
  for (let i = segs.length - 1; i >= 0; i -= 1) {
    if (APP_TAB_ROUTE_NAMES.has(segs[i])) return segs[i];
  }
  return segs[segs.length - 1] || 'dashboard';
}

/**
 * Set animation direction for the next screen focus.
 * @param {ScreenTransitionDirection} direction
 */
export function setScreenTransitionDirection(direction) {
  pendingDirection = direction;
}

/**
 * Read and clear the pending transition (call once on screen focus).
 * @returns {ScreenTransitionDirection}
 */
export function consumeScreenTransitionDirection() {
  const direction = pendingDirection;
  pendingDirection = 'none';
  return direction;
}

/**
 * Dashboard metric card → tab.
 * @param {import('expo-router').Router} router
 * @param {string} route
 */
export function navigateFromDashboard(router, route) {
  setScreenTransitionDirection('forward');
  router.push(`/(app)/${route}`);
}

/**
 * Dashboard deep link — open a tab and scroll/highlight a jar (or savings balance).
 * @param {import('expo-router').Router} router
 * @param {string} route
 * @param {string|null|undefined} focusJar
 */
export function navigateFromDashboardWithFocus(router, route, focusJar) {
  setScreenTransitionDirection('forward');
  if (focusJar) {
    router.push({ pathname: `/(app)/${route}`, params: { focusJar } });
    return;
  }
  router.push(`/(app)/${route}`);
}

/**
 * Tab → dashboard (sidebar or programmatic).
 * @param {import('expo-router').Router} router
 */
export function navigateToDashboard(router) {
  setScreenTransitionDirection('back');
  router.push('/(app)/dashboard');
}

/**
 * Return to another app tab with back animation (e.g. child route → Goals).
 * @param {import('expo-router').Router} router
 * @param {string} route
 */
export function navigateBackToAppTab(router, route) {
  setScreenTransitionDirection('back');
  router.push(`/(app)/${route}`);
}

/**
 * Goals list → goal detail.
 * @param {import('expo-router').Router} router
 * @param {string} goalId
 */
export function navigateToGoalDetail(router, goalId) {
  setScreenTransitionDirection('detail');
  router.push(`/(app)/goals/${goalId}`);
}

/**
 * Savings list → stash tab detail.
 * @param {import('expo-router').Router} router
 * @param {string} stashId
 */
export function navigateToSavingsStashDetail(router, stashId) {
  setScreenTransitionDirection('detail');
  router.push(`/(app)/savings/${encodeStashRouteId(stashId)}`);
}

/**
 * Pop a nested tab detail route with list enter animation.
 * @param {import('expo-router').Router} router
 */
export function navigateBackFromTabDetail(router) {
  setScreenTransitionDirection('detailBack');
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.push('/(app)/dashboard');
}

/**
 * Sidebar tab switch — no dashboard drill-down animation.
 * @param {import('expo-router').Router} router
 * @param {string} route
 * @param {string} [currentRoute]
 */
export function navigateAppTab(router, route, currentRoute) {
  if (route === 'dashboard' && currentRoute !== 'dashboard') {
    navigateToDashboard(router);
    return;
  }
  if (currentRoute === 'dashboard' && route !== 'dashboard') {
    navigateFromDashboard(router, route);
    return;
  }
  setScreenTransitionDirection('lateral');
  router.push(`/(app)/${route}`);
}
