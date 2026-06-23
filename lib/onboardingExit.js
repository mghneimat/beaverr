import { getData, setData, removeData } from './storage';

import {
  patchOnboardingState,
  hasQuickSetupBaseline,
} from './onboardingProgress';

import { getNavHistory, parseHref, resetNavHistory } from './onboardingNavigation';

import { notifyDashboardRefresh } from './dashboardRefresh';

import {

  QUESTIONNAIRE_DATA_KEYS,

  QUESTIONNAIRE_SNAPSHOT_KEY,

  QUICK_SETUP_DATA_KEYS,

  QUICK_SETUP_SNAPSHOT_KEY,

} from './onboardingDataKeys';



/** @typedef {import('./schema').OnboardingState} OnboardingState */



/**

 * @param {OnboardingState|null|undefined} state

 * @returns {boolean}

 */

export function hasEverSubmittedQuestionnaire(state) {

  return state?.questionnaireEverCompleted === true;

}



/**

 * Snapshot current questionnaire data before a retake so Discard can restore it.

 * @returns {Promise<void>}

 */

export async function snapshotQuestionnaireForRetake() {

  /** @type {Record<string, unknown>} */

  const snapshot = {};

  for (const key of QUESTIONNAIRE_DATA_KEYS) {

    snapshot[key] = await getData(key);

  }

  await setData(QUESTIONNAIRE_SNAPSHOT_KEY, snapshot);

}



/**

 * Snapshot quick-setup answers so a full-questionnaire discard can restore them.

 * @returns {Promise<void>}

 */

export async function snapshotQuickSetupData() {

  /** @type {Record<string, unknown>} */

  const snapshot = {};

  for (const key of QUICK_SETUP_DATA_KEYS) {

    snapshot[key] = await getData(key);

  }

  await setData(QUICK_SETUP_SNAPSHOT_KEY, snapshot);

}



/**

 * @returns {Promise<void>}

 */

export async function clearQuestionnaireData() {

  await Promise.all(QUESTIONNAIRE_DATA_KEYS.map((key) => removeData(key)));

}



/**

 * Clears full-questionnaire keys added after quick setup.

 * @returns {Promise<void>}

 */

export async function clearExtendedQuestionnaireData() {

  const extendedKeys = QUESTIONNAIRE_DATA_KEYS.filter(

    (key) => !QUICK_SETUP_DATA_KEYS.includes(key),

  );

  await Promise.all(extendedKeys.map((key) => removeData(key)));

}



/**

 * @returns {Promise<boolean>}

 */

export async function restoreQuestionnaireSnapshot() {

  const snapshot = await getData(QUESTIONNAIRE_SNAPSHOT_KEY);

  if (!snapshot || typeof snapshot !== 'object') return false;



  await Promise.all(

    QUESTIONNAIRE_DATA_KEYS.map(async (key) => {

      if (Object.prototype.hasOwnProperty.call(snapshot, key) && snapshot[key] != null) {

        await setData(key, snapshot[key]);

      }

    }),

  );

  return true;

}



/**

 * @returns {Promise<boolean>}

 */

export async function restoreQuickSetupSnapshot() {

  const snapshot = await getData(QUICK_SETUP_SNAPSHOT_KEY);

  if (!snapshot || typeof snapshot !== 'object') return false;



  await Promise.all(

    QUICK_SETUP_DATA_KEYS.map(async (key) => {

      if (Object.prototype.hasOwnProperty.call(snapshot, key) && snapshot[key] != null) {

        await setData(key, snapshot[key]);

      }

    }),

  );

  return true;

}



/**

 * @param {Object} params

 * @param {string} params.resumeRoute

 * @param {Partial<OnboardingState>} [params.patch]

 * @param {() => Promise<void>|void} [params.onSaveDraft]

 * @returns {Promise<OnboardingState>}

 */

export async function saveOnboardingForLater({ resumeRoute, patch = {}, onSaveDraft }) {
  if (onSaveDraft) {
    await onSaveDraft();
  }

  const navHistory = getNavHistory();
  const resumeEntry = parseHref(resumeRoute);
  const historyWithResume = navHistory.length > 0
    ? navHistory
    : [resumeEntry];

  const next = await patchOnboardingState({
    completed: false,
    dashboardUnlocked: true,
    questionnaireComplete: false,
    resumeRoute,
    navHistory: historyWithResume,
    ...patch,
  });



  notifyDashboardRefresh();

  return next;

}



/**

 * @returns {Promise<void>}

 */

export async function discardOnboardingProgress() {

  const existing = (await getData('beaverr_onboarding')) || {};



  if (hasEverSubmittedQuestionnaire(existing)) {

    await restoreQuestionnaireSnapshot();

    await patchOnboardingState({
      completed: true,
      dashboardUnlocked: true,
      questionnaireComplete: true,
      questionnaireEverCompleted: true,
      resumeRoute: null,
      navHistory: [],
    });

  } else if (hasQuickSetupBaseline(existing)) {

    await restoreQuickSetupSnapshot();

    await clearExtendedQuestionnaireData();

    await patchOnboardingState({
      completed: false,
      dashboardUnlocked: true,
      questionnaireComplete: false,
      questionnaireEverCompleted: false,
      setupMode: 'quick',
      currentStep: 'questionnaire-discarded',
      percentComplete: 0,
      resumeRoute: null,
      navHistory: [],
    });

  } else {

    await clearQuestionnaireData();

    await removeData(QUESTIONNAIRE_SNAPSHOT_KEY);

    await removeData(QUICK_SETUP_SNAPSHOT_KEY);

    await patchOnboardingState({
      completed: false,
      dashboardUnlocked: true,
      questionnaireComplete: false,
      questionnaireEverCompleted: false,
      setupMode: existing.setupMode || 'quick',
      currentStep: 'discarded',
      percentComplete: 0,
      resumeRoute: null,
      navHistory: [],
    });

  }



  await resetNavHistory();

  notifyDashboardRefresh();

}



/**

 * @param {Object} params

 * @param {string} params.messageFirstTime

 * @param {string} params.messageReturning

 * @param {string} params.messageQuickSetup

 * @returns {Promise<string>}

 */

export async function getDiscardConfirmMessage({

  messageFirstTime,

  messageReturning,

  messageQuickSetup,

}) {

  const existing = (await getData('beaverr_onboarding')) || {};

  if (hasEverSubmittedQuestionnaire(existing)) return messageReturning;

  if (hasQuickSetupBaseline(existing)) return messageQuickSetup;

  return messageFirstTime;

}


