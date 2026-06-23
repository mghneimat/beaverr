import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { getSectionProgress, pathnameToRouteName } from './onboardingProgress';
import { normalizeNavParams } from './onboardingNavigation';

/**
 * Monotonic onboarding progress for QuestionScreen / SplashScreen.
 * @param {{ progressStep?: string, disabled?: boolean }} [options]
 * @returns {number|undefined}
 */
export function useMonotonicOnboardingProgress(options = {}) {
  const pathname = usePathname();
  const searchParams = useLocalSearchParams();
  const routeName = pathnameToRouteName(pathname);
  const params = normalizeNavParams(searchParams);
  const step = options.progressStep || params?.step;
  const disabled = options.disabled === true;

  const computed = disabled
    ? undefined
    : getSectionProgress({ routeName, step });

  const maxRef = useRef(0);
  const [displayProgress, setDisplayProgress] = useState(computed ?? 0);

  useEffect(() => {
    if (computed === undefined) return;
    const next = Math.max(maxRef.current, computed);
    maxRef.current = next;
    setDisplayProgress(next);
  }, [computed, routeName, step]);

  return disabled ? undefined : displayProgress;
}
