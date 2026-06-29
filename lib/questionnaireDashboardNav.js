import { getData, setData } from './storage';
import { notifyDashboardRefresh } from './dashboardRefresh';
import { ONBOARDING_STEP_REGISTRY } from './onboardingStepRegistry';
import { resetNavHistory, restoreNavHistoryForResume } from './onboardingNavigation';
import { clearQuestionnaireData, snapshotQuestionnaireForRetake } from './onboardingExit';
import { setHydratingFromCloud } from './cloud/syncHousehold';
import {
  QUESTIONNAIRE_SETUP_MODE_ROUTE,
  getOnboardingState,
  getValidSavedResumeRoute,
  isQuestionnaireComplete,
  patchOnboardingState,
} from './onboardingProgress';

/**
 * Clear saved sub-step cursors so section splashes open at the first question.
 * @returns {Promise<void>}
 */
export async function clearQuestionnaireStepCursors() {
  const entries = Object.values(ONBOARDING_STEP_REGISTRY);
  await Promise.all(entries.map(async (entry) => {
    if (!entry.stepField) return;
    const saved = await getData(entry.storageKey);
    if (!saved || typeof saved !== 'object') return;

    const next = { ...saved, [entry.stepField]: undefined };
    if (entry.routeName === 'household') {
      next.householdOnboardingChildIndex = undefined;
    }
    await setData(entry.storageKey, next);
  }));
}

/**
 * Restore nav history and return saved resume route for Continue questionnaire.
 * @returns {Promise<string|null>}
 */
export async function resolveContinueQuestionnaireRoute() {
  const state = await getOnboardingState();
  const route = getValidSavedResumeRoute(state);
  if (!route) return null;
  await restoreNavHistoryForResume({ ...state, resumeRoute: route });
  return route;
}

/**
 * Reset questionnaire data and resume metadata, then return setup-mode for Start new questionnaire.
 * @returns {Promise<string>}
 */
export async function resolveStartQuestionnaireRoute() {
  const state = await getOnboardingState();
  const hadPriorCompletion = isQuestionnaireComplete(state) || state?.questionnaireEverCompleted === true;

  if (hadPriorCompletion) {
    await snapshotQuestionnaireForRetake();
  }

  setHydratingFromCloud(true);
  try {
    await clearQuestionnaireStepCursors();
    await clearQuestionnaireData();

    await patchOnboardingState({
      completed: false,
      questionnaireComplete: false,
      questionnaireEverCompleted: hadPriorCompletion ? true : false,
      questionnaireRetakeInProgress: hadPriorCompletion,
      setupMode: null,
      currentStep: 'setup-mode',
      percentComplete: 0,
      resumeRoute: null,
      navHistory: [],
      dashboardUnlocked: true,
    });
  } finally {
    setHydratingFromCloud(false);
  }
  await resetNavHistory();
  notifyDashboardRefresh();

  return QUESTIONNAIRE_SETUP_MODE_ROUTE;
}
