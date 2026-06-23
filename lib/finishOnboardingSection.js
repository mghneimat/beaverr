import { useRef } from 'react';
import { useSectionEditOptional } from './SectionEditContext';
import { notifyDashboardRefresh } from './dashboardRefresh';
import { patchOnboardingState } from './onboardingProgress';
import { navigateForward, recordVisit } from './onboardingNavigation';
import { getOnboardingStepRegistryEntry } from './onboardingStepRegistry';
import { getData } from './storage';
import { STORAGE_KEYS } from './beaverrConstants';
import { useI18n } from './i18n';

/**
 * Load registry context for routes that resolve return points from other storage keys.
 * @param {string} routeName
 * @returns {Promise<Record<string, unknown>>}
 */
async function loadRegistryContext(routeName) {
  if (routeName === 'occupation' || routeName === 'income' || routeName === 'residence-permit') {
    const household = await getData(STORAGE_KEYS.household);
    if (routeName === 'occupation') return { household };
    if (routeName === 'income') {
      const occupation = await getData(STORAGE_KEYS.occupation);
      return { household, occupation };
    }
    if (routeName === 'residence-permit') {
      const location = await getData(STORAGE_KEYS.location);
      return { household, location };
    }
    return { household };
  }
  return {};
}

/**
 * Exit helpers for onboarding section screens — supports in-app edit modal vs full onboarding flow.
 */
export function useSectionExit() {
  const { t } = useI18n();
  const edit = useSectionEditOptional();
  const editRef = useRef(edit);
  editRef.current = edit;
  const isEditMode = Boolean(edit?.isActive);
  const editContinueLabel = isEditMode ? t('common.save') : undefined;

  const completeSection = async ({ persist, onboardingPatch, nextRoute, routeName }) => {
    await persist();

    if (editRef.current?.isActive) {
      notifyDashboardRefresh();
      editRef.current.onSaved();
      return;
    }

    if (routeName) {
      const entry = getOnboardingStepRegistryEntry(routeName);
      if (entry?.storageKey) {
        const [saved, context] = await Promise.all([
          getData(entry.storageKey),
          loadRegistryContext(routeName),
        ]);
        const returnPoint = entry.resolveReturnPoint(saved, context);
        recordVisit(entry.route, entry.navParams(returnPoint.step, returnPoint));
      }
    }

    if (onboardingPatch) {
      await patchOnboardingState(onboardingPatch);
      notifyDashboardRefresh();
    }
    navigateForward(nextRoute);
  };

  const leaveSection = (fallback) => {
    if (editRef.current?.isActive) {
      editRef.current.onClose();
      return;
    }
    fallback();
  };

  return { isEditMode, completeSection, leaveSection, editContinueLabel };
}
