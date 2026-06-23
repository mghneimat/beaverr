/**
 * Onboarding navigation history — reliable back/forward despite router.replace().
 */

import { useCallback, useMemo } from 'react';
import { BackHandler, Platform } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useSegments } from 'expo-router';

/** @typedef {{ route: string, params?: Record<string, string> }} NavEntry */

/** @type {NavEntry[]} */
let memoryHistory = [];
/** @type {NavEntry|null} */
let currentEntry = null;
let isNavigatingBack = false;
let persistScheduled = false;
let historyLoaded = false;

/** Fallback when history stack is incomplete (e.g. legacy saves). */
const ONBOARDING_BACK_FALLBACK = /** @type {Record<string, string>} */ ({
  '/(onboarding)/consent': '/(onboarding)/welcome',
  '/(onboarding)/setup-mode': '/(onboarding)/consent',
  '/(onboarding)/quick-setup': '/(onboarding)/setup-mode',
  '/(onboarding)/splash-household': '/(onboarding)/setup-mode',
  '/(onboarding)/household': '/(onboarding)/splash-household',
  '/(onboarding)/splash-location': '/(onboarding)/splash-household',
  '/(onboarding)/location': '/(onboarding)/splash-location',
  '/(onboarding)/citizenship': '/(onboarding)/location',
  '/(onboarding)/residence-permit': '/(onboarding)/citizenship',
  '/(onboarding)/occupation': '/(onboarding)/citizenship',
  '/(onboarding)/splash-income': '/(onboarding)/occupation',
  '/(onboarding)/income': '/(onboarding)/splash-income',
  '/(onboarding)/splash-strategy': '/(onboarding)/income',
  '/(onboarding)/strategy': '/(onboarding)/splash-strategy',
  '/(onboarding)/splash-housing': '/(onboarding)/strategy',
  '/(onboarding)/housing': '/(onboarding)/splash-housing',
  '/(onboarding)/splash-transport': '/(onboarding)/housing',
  '/(onboarding)/transport': '/(onboarding)/splash-transport',
  '/(onboarding)/splash-health': '/(onboarding)/transport',
  '/(onboarding)/health': '/(onboarding)/splash-health',
  '/(onboarding)/splash-children': '/(onboarding)/health',
  '/(onboarding)/children-costs': '/(onboarding)/splash-children',
  '/(onboarding)/splash-pets': '/(onboarding)/children-costs',
  '/(onboarding)/pets': '/(onboarding)/splash-pets',
  '/(onboarding)/splash-subscriptions': '/(onboarding)/pets',
  '/(onboarding)/subscriptions': '/(onboarding)/splash-subscriptions',
  '/(onboarding)/splash-other-costs': '/(onboarding)/subscriptions',
  '/(onboarding)/splash-debts': '/(onboarding)/splash-other-costs',
  '/(onboarding)/debts': '/(onboarding)/splash-debts',
  '/(onboarding)/splash-budget': '/(onboarding)/debts',
  '/(onboarding)/budget-setup': '/(onboarding)/splash-budget',
  '/(onboarding)/budget-rollover': '/(onboarding)/budget-setup',
  '/(onboarding)/budget-spending-strategy': '/(onboarding)/budget-rollover',
  '/(onboarding)/splash-review': '/(onboarding)/budget-spending-strategy',
  '/(onboarding)/review': '/(onboarding)/splash-review',
});

/**
 * @param {NavEntry|null|undefined} a
 * @param {NavEntry|null|undefined} b
 * @returns {boolean}
 */
export function entriesEqual(a, b) {
  if (!a || !b) return false;
  if (a.route !== b.route) return false;
  const pa = a.params || {};
  const pb = b.params || {};
  const keys = new Set([...Object.keys(pa), ...Object.keys(pb)]);
  for (const key of keys) {
    if (String(pa[key] ?? '') !== String(pb[key] ?? '')) return false;
  }
  return true;
}

/**
 * @param {string} route
 * @param {Record<string, string|undefined>|undefined} [params]
 * @returns {string}
 */
export function buildHref(route, params) {
  if (!params) return route;
  const filtered = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (filtered.length === 0) return route;
  const qs = new URLSearchParams(
    Object.fromEntries(filtered.map(([k, v]) => [k, String(v)])),
  ).toString();
  return `${route}?${qs}`;
}

/**
 * @param {string} href
 * @returns {NavEntry}
 */
export function parseHref(href) {
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
 * @param {string[]} segments
 * @returns {string}
 */
export function segmentsToOnboardingRoute(segments) {
  const leaf = [...segments].reverse().find(
    (segment) => segment && !segment.startsWith('('),
  );
  return leaf ? `/(onboarding)/${leaf}` : '/(onboarding)/welcome';
}

/**
 * @param {Record<string, string|string[]|undefined>} rawParams
 * @returns {Record<string, string>|undefined}
 */
export function normalizeNavParams(rawParams) {
  if (!rawParams || typeof rawParams !== 'object') return undefined;
  /** @type {Record<string, string>} */
  const params = {};
  for (const [key, value] of Object.entries(rawParams)) {
    if (value == null || value === '') continue;
    params[key] = Array.isArray(value) ? value[0] : String(value);
  }
  return Object.keys(params).length > 0 ? params : undefined;
}

async function patchOnboardingNavState(patch) {
  const { patchOnboardingState } = await import('./onboardingProgress');
  return patchOnboardingState(patch);
}

async function persistHistory() {
  persistScheduled = false;
  await patchOnboardingNavState({ navHistory: memoryHistory });
}

function schedulePersistHistory() {
  if (persistScheduled) return;
  persistScheduled = true;
  queueMicrotask(() => {
    persistHistory().catch(() => {});
  });
}

/**
 * @returns {NavEntry[]}
 */
export function getNavHistory() {
  return [...memoryHistory];
}

/**
 * @param {import('./schema').OnboardingState|null|undefined} state
 * @returns {Promise<void>}
 */
export async function resetNavHistory(initialEntries = null) {
  historyLoaded = true;
  if (!initialEntries) {
    memoryHistory = [];
    currentEntry = null;
  } else if (Array.isArray(initialEntries)) {
    memoryHistory = initialEntries.map((entry) => ({
      route: entry.route,
      params: entry.params ? { ...entry.params } : undefined,
    }));
    currentEntry = memoryHistory[memoryHistory.length - 1] ?? null;
  } else {
    memoryHistory = [{
      route: initialEntries.route,
      params: initialEntries.params ? { ...initialEntries.params } : undefined,
    }];
    currentEntry = memoryHistory[0];
  }
  await patchOnboardingNavState({ navHistory: memoryHistory });
}

/**
 * @param {string} route
 * @param {Record<string, string|undefined>|undefined} [params]
 */
export function recordVisit(route, params) {
  if (isNavigatingBack) return;

  /** @type {NavEntry} */
  const entry = { route, params: normalizeNavParams(params) };

  if (entriesEqual(currentEntry, entry)) return;

  currentEntry = entry;
  const last = memoryHistory[memoryHistory.length - 1];

  if (entriesEqual(last, entry)) return;

  if (last && last.route === entry.route) {
    memoryHistory[memoryHistory.length - 1] = entry;
    schedulePersistHistory();
    return;
  }

  memoryHistory.push(entry);
  schedulePersistHistory();
}

/**
 * @param {string} href
 * @returns {Promise<void>}
 */
export async function navigateForward(href) {
  isNavigatingBack = false;
  historyLoaded = true;
  router.replace(href);
}

/**
 * @param {NavEntry|null|undefined} current
 * @returns {string|null}
 */
function getFallbackBackHref(current) {
  if (!current?.route) return '/(onboarding)/welcome';
  if (current.route === '/(onboarding)/welcome') return null;
  return ONBOARDING_BACK_FALLBACK[current.route] || '/(onboarding)/welcome';
}

/**
 * @returns {Promise<void>}
 */
export async function navigateBack() {
  if (memoryHistory.length > 1) {
    memoryHistory.pop();
    const previous = memoryHistory[memoryHistory.length - 1];
    schedulePersistHistory();

    isNavigatingBack = true;
    router.replace(buildHref(previous.route, previous.params));
    isNavigatingBack = false;
    return;
  }

  const current = memoryHistory[memoryHistory.length - 1] || currentEntry;
  const fallbackHref = getFallbackBackHref(current);
  if (!fallbackHref) return;

  const fallbackEntry = parseHref(fallbackHref);
  memoryHistory = [fallbackEntry];
  currentEntry = fallbackEntry;
  schedulePersistHistory();

  isNavigatingBack = true;
  router.replace(fallbackHref);
  isNavigatingBack = false;
}

/**
 * Pop the current screen and navigate to a storage-resolved target.
 * Used when section splashes must reopen the prior section at the correct step.
 * @param {string} href
 * @param {NavEntry} [priorEntry]
 * @returns {Promise<void>}
 */
export async function navigateBackWithTarget(href, priorEntry) {
  if (memoryHistory.length > 0) {
    memoryHistory.pop();
  }

  if (priorEntry) {
    const last = memoryHistory[memoryHistory.length - 1];
    const entry = {
      route: priorEntry.route,
      params: priorEntry.params ? { ...priorEntry.params } : undefined,
    };
    if (last?.route === entry.route) {
      memoryHistory[memoryHistory.length - 1] = entry;
    } else {
      memoryHistory.push(entry);
    }
    currentEntry = entry;
  }

  schedulePersistHistory();

  isNavigatingBack = true;
  router.replace(href);
  isNavigatingBack = false;
}

/**
 * @param {import('./schema').OnboardingState|null|undefined} state
 * @returns {string}
 */
export function buildResumeHref(state) {
  return state?.resumeRoute || '/(onboarding)/welcome';
}

/**
 * Restore nav history when resuming saved progress.
 * @param {import('./schema').OnboardingState|null|undefined} state
 * @returns {Promise<void>}
 */
export async function restoreNavHistoryForResume(state) {
  historyLoaded = true;
  if (Array.isArray(state?.navHistory) && state.navHistory.length > 0) {
    memoryHistory = state.navHistory.map((entry) => ({
      route: entry.route,
      params: entry.params ? { ...entry.params } : undefined,
    }));
    currentEntry = memoryHistory[memoryHistory.length - 1] ?? null;
    return;
  }

  const resume = state?.resumeRoute;
  if (resume) {
    const entry = parseHref(resume);
    memoryHistory = [entry];
    currentEntry = entry;
    await patchOnboardingNavState({ navHistory: memoryHistory });
  }
}

/** Standard entry chain before setup-mode. */
export const ONBOARDING_ENTRY_HISTORY = /** @type {NavEntry[]} */ ([
  { route: '/(onboarding)/welcome' },
  { route: '/(onboarding)/consent' },
]);

/**
 * Registers the current screen in nav history and wires Android hardware back.
 * @param {{ progressStep?: string, childIndex?: number }} [options]
 */
export function useOnboardingScreen(options = {}) {
  const segments = useSegments();
  const searchParams = useLocalSearchParams();
  const progressStep = options.progressStep;
  const childIndex = options.childIndex;
  const route = segmentsToOnboardingRoute(segments);

  const visitParamsKey = useMemo(() => {
    const normalized = normalizeNavParams(searchParams) || {};
    const p = { ...normalized };
    if (!p.step && progressStep) {
      p.step = progressStep;
      if (childIndex != null && progressStep === 'childDetails') {
        p.childIndex = String(childIndex);
      }
    }
    return JSON.stringify(p);
  }, [searchParams, progressStep, childIndex]);

  useFocusEffect(
    useCallback(() => {
      const visitParams = visitParamsKey === '{}'
        ? undefined
        : JSON.parse(visitParamsKey);
      recordVisit(route, visitParams);

      if (Platform.OS !== 'android') return undefined;

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        navigateBack();
        return true;
      });

      return () => subscription.remove();
    }, [route, visitParamsKey]),
  );
}

/**
 * Hook for screens that need default back navigation.
 * @returns {() => void}
 */
export function useOnboardingBack() {
  return useCallback(() => {
    navigateBack();
  }, []);
}

/** @internal test helper */
export function __resetNavHistoryForTests(entries = []) {
  memoryHistory = [...entries];
  currentEntry = entries[entries.length - 1] ?? null;
  isNavigatingBack = false;
  persistScheduled = false;
  historyLoaded = false;
}
