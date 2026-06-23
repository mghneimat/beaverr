/**
 * Shared multi-step onboarding hook — URL params, focus reload, nav history.
 */

import { useState, useCallback } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useOnboardingScreen } from './onboardingNavigation';
import { normalizeOnboardingStep } from './onboardingStepAliases';
import { getOnboardingStepRegistryEntry } from './onboardingStepRegistry';

/**
 * @param {string|string[]|undefined} value
 * @returns {string|undefined}
 */
function readRouteParam(value) {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

/**
 * @param {string|string[]|undefined} value
 * @returns {number}
 */
function readChildIndexParam(value) {
  const raw = readRouteParam(value);
  if (raw == null) return 0;
  return Math.max(0, parseInt(String(raw), 10) || 0);
}

/**
 * @typedef {Object} UseOnboardingMultiStepOptions
 * @property {string} [defaultStep]
 * @property {() => void | Promise<void>} [onFocus]
 * @property {(saved: object|null|undefined) => { step?: string, childIndex?: number, subject?: string }} [loadStepFromStorage]
 * @property {number} [childIndex]
 */

/**
 * @param {string} routeName
 * @param {UseOnboardingMultiStepOptions} [options]
 */
export function useOnboardingMultiStep(routeName, options = {}) {
  const registry = getOnboardingStepRegistryEntry(routeName);
  const params = useLocalSearchParams();
  const defaultStep = options.defaultStep || registry?.steps?.[0] || '';

  const urlStep = readRouteParam(params.step);
  const urlSubject = readRouteParam(params.subject);
  const urlChildIndex = readChildIndexParam(params.childIndex);

  const initialStep = urlStep
    ? normalizeOnboardingStep(routeName, urlStep)
    : urlSubject || defaultStep;

  const [step, setStepRaw] = useState(initialStep || defaultStep);
  const [childIndex, setChildIndex] = useState(
    options.childIndex ?? urlChildIndex,
  );

  const setStep = useCallback((next) => {
    setStepRaw(normalizeOnboardingStep(routeName, next) || defaultStep);
  }, [routeName, defaultStep]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        if (options.onFocus) {
          await options.onFocus();
        }
        if (cancelled || !options.loadStepFromStorage || !registry?.storageKey) return;

        const { getData } = await import('./storage');
        const saved = await getData(registry.storageKey);
        const loaded = options.loadStepFromStorage(saved);
        if (cancelled || !loaded?.step || urlStep) return;

        setStep(loaded.step);
        if (loaded.childIndex != null) {
          setChildIndex(loaded.childIndex);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [urlStep, options.onFocus, options.loadStepFromStorage, registry?.storageKey]),
  );

  const progressChildIndex = step === 'childDetails' || urlSubject === 'child'
    ? childIndex
    : options.childIndex;

  useOnboardingScreen({
    progressStep: step,
    childIndex: progressChildIndex,
  });

  return {
    step,
    setStep,
    childIndex,
    setChildIndex,
    subject: urlSubject,
    params,
  };
}
