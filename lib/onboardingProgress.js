/**
 * Onboarding progress, quick-setup gating, and resume routing.
 */

import { getData, setData } from './storage';
import { STEPS_BY_ROUTE } from './onboardingStepRegistry';

/** @typedef {import('./schema').OnboardingState} OnboardingState */

/**
 * Build stepsByRoute for a section from the step registry.
 * @param {string[]} routes
 * @returns {Record<string, string[]>|undefined}
 */
function registryStepsForRoutes(routes) {
  /** @type {Record<string, string[]>} */
  const stepsByRoute = {};
  for (const routeName of routes) {
    const steps = STEPS_BY_ROUTE[routeName];
    if (steps?.length) stepsByRoute[routeName] = steps;
  }
  return Object.keys(stepsByRoute).length > 0 ? stepsByRoute : undefined;
}

/** Tabs locked until full questionnaire is submitted. */
export const QUICK_LOCKED_TAB_ROUTES = [
  'costs',
  'budget',
  'goals',
  'savings',
  'summary',
  'alerts',
];

/** Completion % after quick setup (minimum viable data). */
export const QUICK_SETUP_PERCENT = 25;

/** Default resume point after quick setup (income section). */
export const QUICK_RESUME_ROUTE = '/(onboarding)/splash-income';

/** First screen when starting a fresh full questionnaire (non-quick path). */
export const FULL_QUESTIONNAIRE_START_ROUTE = '/(onboarding)/splash-household';

/** Entry point for "Start new questionnaire" from the dashboard. */
export const QUESTIONNAIRE_WELCOME_ROUTE = '/(onboarding)/welcome';

/** Setup path choice — quick vs full questionnaire. */
export const QUESTIONNAIRE_SETUP_MODE_ROUTE = '/(onboarding)/setup-mode';

/** Removed or renamed Expo routes — rewrite persisted resume/nav entries. */
export const LEGACY_RESUME_ROUTE_ALIASES = {
  '/(onboarding)/budget': '/(onboarding)/budget-setup',
  '/(onboarding)/quick-setup': '/(onboarding)/quick-housing',
};

/**
 * @param {string} href
 * @returns {{ route: string, params?: Record<string, string> }}
 */
function splitOnboardingHref(href) {
  const [route, query = ''] = href.split('?');
  /** @type {Record<string, string>} */
  const params = {};
  if (query) {
    new URLSearchParams(query).forEach((value, key) => {
      params[key] = value;
    });
  }
  return {
    route,
    params: Object.keys(params).length > 0 ? params : undefined,
  };
}

/**
 * @param {string} route
 * @param {Record<string, string>|undefined} params
 * @returns {string}
 */
function buildOnboardingHref(route, params) {
  if (!params) return route;
  const filtered = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (filtered.length === 0) return route;
  const qs = new URLSearchParams(
    Object.fromEntries(filtered.map(([k, v]) => [k, String(v)])),
  ).toString();
  return `${route}?${qs}`;
}

/**
 * @param {string} route
 * @returns {string|null}
 */
function canonicalOnboardingRoutePath(route) {
  if (!route || typeof route !== 'string') return null;
  const path = route.split('?')[0];
  if (path.startsWith('/(onboarding)/')) return path;
  const segment = path.replace(/^\//, '').split('/').filter(Boolean).pop();
  if (!segment) return null;
  return `/(onboarding)/${segment}`;
}

/**
 * @param {OnboardingState|null|undefined} state
 * @returns {boolean}
 */
export function isDashboardUnlocked(state) {
  if (!state) return false;
  return state.completed === true || state.dashboardUnlocked === true;
}

/**
 * @param {OnboardingState|null|undefined} state
 * @returns {boolean}
 */
export function isQuestionnaireComplete(state) {
  if (!state) return false;
  return state.completed === true || state.questionnaireComplete === true;
}

/**
 * @param {OnboardingState|null|undefined} state
 * @returns {boolean}
 */
export function isQuickSetupIncomplete(state) {
  return isDashboardUnlocked(state) && !isQuestionnaireComplete(state);
}

/**
 * @param {OnboardingState|null|undefined} state
 * @returns {boolean}
 */
export function shouldShowQuestionnaireBanners(state) {
  if (!isDashboardUnlocked(state) || isQuestionnaireComplete(state)) return false;
  if (state?.questionnaireEverCompleted === true) return false;
  return true;
}

/**
 * Red estimate warning on the questionnaire banner.
 * @param {OnboardingState|null|undefined} state
 * @returns {boolean}
 */
export function shouldShowQuestionnaireEstimateWarning(state) {
  return shouldShowQuestionnaireBanners(state);
}

/**
 * Soft continue UI in sidebar when retaking after a prior submit.
 * @param {OnboardingState|null|undefined} state
 * @returns {boolean}
 */
export function shouldShowQuestionnaireContinueSoft(state) {
  return isDashboardUnlocked(state)
    && !isQuestionnaireComplete(state)
    && state?.questionnaireEverCompleted === true;
}

/**
 * Retake is available only after a prior full submit, and hidden while continue-in-progress is shown.
 * @param {OnboardingState|null|undefined} state
 * @returns {boolean}
 */
export function shouldShowRetakeQuestionnaire(state) {
  const everCompleted =
    state?.questionnaireEverCompleted === true || state?.completed === true;
  if (!everCompleted) return false;
  return isQuestionnaireComplete(state);
}

/**
 * Repair onboarding flags lost when section saves replaced the full state object.
 * @param {OnboardingState|null|undefined} state
 * @returns {OnboardingState|null|undefined}
 */
export function repairOnboardingState(state) {
  if (!state || typeof state !== 'object') return state;

  const next = { ...state };
  let changed = false;

  const midQuestionnaire =
    next.completed === false &&
    typeof next.currentStep === 'string' &&
    next.currentStep.length > 0;

  if (midQuestionnaire && next.dashboardUnlocked !== true) {
    next.dashboardUnlocked = true;
    changed = true;
  }

  if (midQuestionnaire && next.questionnaireComplete !== false) {
    next.questionnaireComplete = false;
    changed = true;
  }

  if (next.completed === true && next.questionnaireEverCompleted !== true) {
    next.questionnaireEverCompleted = true;
    changed = true;
  }

  if (next.completed === true && next.questionnaireComplete !== true) {
    next.questionnaireComplete = true;
    changed = true;
  }

  if (next.dashboardUnlocked === true && !next.setupMode) {
    const quickSteps = new Set(['quick-setup', 'quick-setup-done', 'quick-housing', 'quick-housing-done']);
    const deferSetupMode = new Set(['setup-mode', 'discarded']);
    if (!deferSetupMode.has(next.currentStep)) {
      next.setupMode = quickSteps.has(next.currentStep) ? 'quick' : 'full';
      changed = true;
    }
  }

  if (next.resumeRoute && LEGACY_RESUME_ROUTE_ALIASES[next.resumeRoute]) {
    next.resumeRoute = LEGACY_RESUME_ROUTE_ALIASES[next.resumeRoute];
    changed = true;
  }

  if (next.currentStep === 'quick-setup') {
    next.currentStep = 'quick-housing';
    changed = true;
  } else if (next.currentStep === 'quick-setup-done') {
    next.currentStep = 'quick-housing-done';
    changed = true;
  }

  if (Array.isArray(next.navHistory) && next.navHistory.length > 0) {
    let navChanged = false;
    const navHistory = next.navHistory.map((entry) => {
      const route = entry?.route;
      const migrated = route && LEGACY_RESUME_ROUTE_ALIASES[route];
      if (!migrated) return entry;
      navChanged = true;
      return { ...entry, route: migrated };
    });
    if (navChanged) {
      next.navHistory = navHistory;
      changed = true;
    }
  }

  return changed ? next : state;
}

/**
 * @param {OnboardingState|null|undefined} state
 * @returns {boolean}
 */
export function hasQuickSetupBaseline(state) {
  if (!state) return false;
  return state.setupMode === 'quick' && state.dashboardUnlocked === true;
}

/**
 * Saved resume route only — null after discard until user saves progress again.
 * @param {OnboardingState|null|undefined} state
 * @returns {string|null}
 */
export function getSavedResumeRoute(state) {
  return state?.resumeRoute ?? null;
}

/**
 * @param {OnboardingState|null|undefined} state
 * @returns {boolean}
 */
export function shouldShowContinueQuestionnaire(state) {
  return shouldShowQuestionnaireBanners(state) && Boolean(getValidSavedResumeRoute(state));
}

/**
 * @param {OnboardingState|null|undefined} state
 * @returns {boolean}
 */
export function shouldShowStartQuestionnaire(state) {
  return shouldShowQuestionnaireBanners(state) && !getValidSavedResumeRoute(state);
}

/**
 * @param {OnboardingState|null|undefined} _state
 * @returns {string}
 */
export function getQuestionnaireStartRoute(_state) {
  return QUESTIONNAIRE_SETUP_MODE_ROUTE;
}

/**
 * Route for continue — uses saved progress or quick-setup entry when resume is set.
 * @param {OnboardingState|null|undefined} state
 * @returns {string}
 */
export function getResumeRoute(state) {
  return getValidSavedResumeRoute(state) || QUICK_RESUME_ROUTE;
}

/**
 * Banner / CTA target — continue when saved, otherwise start fresh.
 * @param {OnboardingState|null|undefined} state
 * @returns {string}
 */
export function getQuestionnaireNavigationRoute(state) {
  const saved = getValidSavedResumeRoute(state);
  if (saved) return saved;

  if (state?.questionnaireEverCompleted === true) {
    return QUICK_RESUME_ROUTE;
  }

  if (hasQuickSetupBaseline(state)) return QUICK_RESUME_ROUTE;
  return getQuestionnaireStartRoute(state);
}

/**
 * Where welcome "Start now" should route based on saved onboarding state.
 * @param {OnboardingState|null|undefined} state
 * @returns {string}
 */
export function getWelcomeContinueRoute(state) {
  if (isDashboardUnlocked(state)) {
    if (isQuestionnaireComplete(state)) {
      return '/(app)/dashboard';
    }
    const saved = getValidSavedResumeRoute(state);
    if (saved) return saved;
    if (hasQuickSetupBaseline(state)) return QUICK_RESUME_ROUTE;
    if (state?.setupMode === 'full') return FULL_QUESTIONNAIRE_START_ROUTE;
    return '/(onboarding)/setup-mode';
  }

  if (state?.setupMode === 'quick') {
    return getValidSavedResumeRoute(state) || '/(onboarding)/household';
  }

  const saved = getValidSavedResumeRoute(state);
  if (saved) return saved;

  return '/(onboarding)/setup-mode';
}

/**
 * @param {OnboardingState|null|undefined} state
 * @param {string} routeName - Last segment of app route (e.g. 'costs')
 * @returns {boolean}
 */
export function isTabLockedForQuickSetup(state, routeName) {
  if (!isQuickSetupIncomplete(state)) return false;
  return QUICK_LOCKED_TAB_ROUTES.includes(routeName);
}

/**
 * @param {OnboardingState|null|undefined} state
 * @returns {number}
 */
export function getQuestionnairePercent(state) {
  if (!state) return 0;
  if (isQuestionnaireComplete(state)) return 100;
  return Math.min(99, Math.max(0, Number(state.percentComplete) || 0));
}

/**
 * @param {Partial<OnboardingState>} patch
 * @returns {Promise<OnboardingState>}
 */
export async function patchOnboardingState(patch) {
  const current = repairOnboardingState((await getData('beaverr_onboarding')) || {}) || {};
  const next = repairOnboardingState({ ...current, ...patch }) || { ...current, ...patch };
  await setData('beaverr_onboarding', next);
  return next;
}

/**
 * Load onboarding state with integrity repair for legacy/corrupted saves.
 * @returns {Promise<OnboardingState|null>}
 */
export async function getOnboardingState() {
  const raw = await getData('beaverr_onboarding');
  const repaired = repairOnboardingState(raw);
  if (repaired && repaired !== raw) {
    await setData('beaverr_onboarding', repaired);
  }
  return repaired ?? raw ?? null;
}

/**
 * @typedef {Object} OnboardingSectionDef
 * @property {string} id
 * @property {string[]} routes - Route file names within section (order matters)
 * @property {number} startPercent
 * @property {number} endPercent
 * @property {Record<string, string[]>} [stepsByRoute] - Sub-step ids for multi-step screens
 */

/** Ordered questionnaire sections — progress never decreases within a session. */
export const ONBOARDING_SECTIONS = /** @type {OnboardingSectionDef[]} */ ([
  {
    id: 'entry',
    routes: ['welcome', 'setup-mode', 'quick-housing'],
    startPercent: 0,
    endPercent: 4,
  },
  {
    id: 'household',
    routes: ['splash-household', 'household'],
    startPercent: 4,
    endPercent: 10,
    stepsByRoute: registryStepsForRoutes(['household']),
  },
  {
    id: 'location',
    routes: ['splash-residence', 'citizenship', 'residence-permit', 'occupation'],
    startPercent: 10,
    endPercent: 22,
    stepsByRoute: registryStepsForRoutes(['occupation']),
  },
  {
    id: 'income',
    routes: ['splash-income', 'income'],
    startPercent: 22,
    endPercent: 32,
    stepsByRoute: registryStepsForRoutes(['income']),
  },
  {
    id: 'strategy',
    routes: ['splash-strategy', 'strategy'],
    startPercent: 32,
    endPercent: 38,
    stepsByRoute: registryStepsForRoutes(['strategy']),
  },
  {
    id: 'housing',
    routes: ['splash-housing', 'housing'],
    startPercent: 38,
    endPercent: 48,
    stepsByRoute: registryStepsForRoutes(['housing']),
  },
  {
    id: 'transport',
    routes: ['splash-transport', 'transport'],
    startPercent: 48,
    endPercent: 56,
    stepsByRoute: registryStepsForRoutes(['transport']),
  },
  {
    id: 'health',
    routes: ['splash-health', 'health'],
    startPercent: 56,
    endPercent: 62,
  },
  {
    id: 'children',
    routes: ['splash-children', 'children-costs'],
    startPercent: 62,
    endPercent: 67,
    stepsByRoute: registryStepsForRoutes(['children-costs']),
  },
  {
    id: 'pets',
    routes: ['splash-pets', 'pets'],
    startPercent: 67,
    endPercent: 72,
  },
  {
    id: 'subscriptions',
    routes: ['splash-subscriptions', 'subscriptions'],
    startPercent: 72,
    endPercent: 76,
  },
  {
    id: 'other-costs',
    routes: ['splash-other-costs', 'other-costs'],
    startPercent: 76,
    endPercent: 80,
  },
  {
    id: 'debts',
    routes: ['splash-debts', 'debts'],
    startPercent: 80,
    endPercent: 84,
  },
  {
    id: 'budget',
    routes: ['splash-budget', 'budget', 'budget-setup', 'budget-rollover', 'budget-spending-strategy'],
    startPercent: 84,
    endPercent: 96,
    stepsByRoute: registryStepsForRoutes(['budget-setup', 'budget-rollover', 'budget-spending-strategy']),
  },
  {
    id: 'review',
    routes: ['splash-review', 'review'],
    startPercent: 96,
    endPercent: 99,
  },
]);

/** @type {Set<string>|null} */
let knownOnboardingResumeRoutes = null;

/**
 * @returns {Set<string>}
 */
function getKnownOnboardingResumeRoutes() {
  if (!knownOnboardingResumeRoutes) {
    knownOnboardingResumeRoutes = new Set(
      ONBOARDING_SECTIONS.flatMap((section) => section.routes.map(
        (routeName) => `/(onboarding)/${routeName}`,
      )),
    );
  }
  return knownOnboardingResumeRoutes;
}

/**
 * Map legacy resume routes and drop unknown targets (deleted screens).
 * @param {string|null|undefined} resume
 * @returns {string|null}
 */
export function normalizeResumeRoute(resume) {
  if (!resume || typeof resume !== 'string') return null;
  const { route, params } = splitOnboardingHref(resume);
  const canonical = canonicalOnboardingRoutePath(route);
  if (!canonical) return null;
  const aliased = LEGACY_RESUME_ROUTE_ALIASES[canonical] ?? canonical;
  if (!getKnownOnboardingResumeRoutes().has(aliased)) return null;
  return buildOnboardingHref(aliased, params);
}

/**
 * @param {OnboardingState|null|undefined} state
 * @returns {string|null}
 */
export function getValidSavedResumeRoute(state) {
  return normalizeResumeRoute(getSavedResumeRoute(state));
}

/**
 * Safe resume target for boot redirect — null when missing or unknown.
 * @param {OnboardingState|null|undefined} state
 * @returns {string|null}
 */
export function resolveBootResumeRoute(state) {
  return getValidSavedResumeRoute(state);
}

/**
 * @param {string} pathname
 * @returns {string}
 */
export function pathnameToRouteName(pathname) {
  if (!pathname) return 'welcome';
  const cleaned = pathname.replace(/^\//, '');
  const parts = cleaned.split('/').filter(Boolean);
  const onboardingIdx = parts.indexOf('(onboarding)');
  if (onboardingIdx >= 0 && parts[onboardingIdx + 1]) {
    return parts[onboardingIdx + 1];
  }
  return parts[parts.length - 1] || 'welcome';
}

/**
 * @param {OnboardingSectionDef} section
 * @param {string} routeName
 * @param {string|undefined} step
 * @returns {number}
 */
function getProgressWithinSection(section, routeName, step) {
  const { routes, startPercent, endPercent, stepsByRoute } = section;
  const routeIdx = routes.indexOf(routeName);
  if (routeIdx < 0) return startPercent;

  const span = endPercent - startPercent;

  if (routeName.startsWith('splash-')) {
    return startPercent;
  }

  const stepList = stepsByRoute?.[routeName];
  if (step && stepList?.length) {
    const stepIdx = stepList.indexOf(step);
    if (stepIdx >= 0) {
      const stepSpan = span / (stepList.length + 1);
      return Math.round(startPercent + stepSpan * (stepIdx + 1));
    }
  }

  const questionRoutes = routes.filter((r) => !r.startsWith('splash-'));
  const qIdx = questionRoutes.indexOf(routeName);
  if (qIdx >= 0 && questionRoutes.length > 0) {
    const slice = span / questionRoutes.length;
    return Math.round(startPercent + slice * (qIdx + 0.5));
  }

  return Math.round(startPercent + (span * (routeIdx + 0.5)) / routes.length);
}

/**
 * @param {Object} params
 * @param {string} params.routeName - Last segment of onboarding route
 * @param {string} [params.step]
 * @param {number} [params.storedPercent]
 * @returns {number}
 */
export function getSectionProgress({ routeName, step, storedPercent }) {
  const section = ONBOARDING_SECTIONS.find((s) => s.routes.includes(routeName));
  if (!section) return Math.min(99, Math.max(0, Number(storedPercent) || 0));

  const computed = getProgressWithinSection(section, routeName, step);
  const stored = Number(storedPercent) || 0;
  return Math.min(99, Math.max(computed, stored));
}

/**
 * @param {string} sectionId
 * @returns {Promise<OnboardingState>}
 */
export async function patchProgressOnSectionComplete(sectionId) {
  const section = ONBOARDING_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return patchOnboardingState({});

  const state = await getOnboardingState();
  const stored = Number(state?.percentComplete) || 0;
  const nextPercent = Math.max(stored, section.endPercent);

  return patchOnboardingState({ percentComplete: nextPercent });
}

