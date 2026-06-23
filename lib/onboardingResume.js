/**
 * Section splash back-navigation — reopen prior section at saved sub-step.
 */

import { getData } from './storage';
import { navigateBackWithTarget } from './onboardingNavigation';
import { ONBOARDING_SECTIONS, pathnameToRouteName } from './onboardingProgress';
import { getOnboardingStepRegistryEntry } from './onboardingStepRegistry';

/**
 * @param {string} routeName
 * @returns {Promise<Record<string, unknown>>}
 */
async function loadRegistryContext(routeName) {
  const { STORAGE_KEYS } = await import('./beaverrConstants');

  if (routeName === 'occupation' || routeName === 'income' || routeName === 'residence-permit') {
    const household = await getData(STORAGE_KEYS.household);
    if (routeName === 'occupation') return { household };
    if (routeName === 'income') {
      const occupation = await getData(STORAGE_KEYS.occupation);
      return { household, occupation };
    }
    const location = await getData(STORAGE_KEYS.location);
    return { household, location };
  }

  return {};
}

/**
 * Last question-route name in the section before the given splash.
 * @param {string} splashRoute - Full route or splash route name (e.g. splash-income)
 * @returns {string|null}
 */
export function getPreviousSectionLastRoute(splashRoute) {
  const splashName = pathnameToRouteName(splashRoute);
  const sectionIdx = ONBOARDING_SECTIONS.findIndex((section) => section.routes.includes(splashName));
  if (sectionIdx <= 0) return null;

  const prevSection = ONBOARDING_SECTIONS[sectionIdx - 1];
  const questionRoutes = prevSection.routes.filter((route) => !route.startsWith('splash-'));
  return questionRoutes[questionRoutes.length - 1] ?? null;
}

/**
 * Pop splash and navigate to the prior section's storage-resolved resume point.
 * @param {string} splashRoute
 * @returns {Promise<void>}
 */
export async function navigateBackFromSectionSplash(splashRoute) {
  const prevRouteName = getPreviousSectionLastRoute(splashRoute);
  if (!prevRouteName) {
    const { navigateBack } = await import('./onboardingNavigation');
    await navigateBack();
    return;
  }

  const entry = getOnboardingStepRegistryEntry(prevRouteName);
  if (!entry) {
    const { navigateBack } = await import('./onboardingNavigation');
    await navigateBack();
    return;
  }

  const [saved, context] = await Promise.all([
    getData(entry.storageKey),
    loadRegistryContext(prevRouteName),
  ]);

  const returnPoint = entry.resolveReturnPoint(saved, context);
  const href = entry.buildResumeRoute(returnPoint.step, returnPoint);
  const params = entry.navParams(returnPoint.step, returnPoint);

  await navigateBackWithTarget(href, {
    route: entry.route,
    params,
  });
}
