import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useDashboardScroll } from '../../lib/dashboardScroll';

/**
 * Scroll to a jar anchor and trigger a one-shot glow after scroll settles.
 * @param {string|null|undefined} focusJarId
 * @param {string} targetJarId
 * @param {import('react').RefObject<import('react-native').View>} anchorRef
 */
export function useJarFocusHighlight(focusJarId, targetJarId, anchorRef) {
  const { scrollToAnchor } = useDashboardScroll();
  const router = useRouter();
  const [glowToken, setGlowToken] = useState(0);

  useEffect(() => {
    if (!focusJarId || focusJarId !== targetJarId) return;

    scrollToAnchor(anchorRef, 32, () => {
      setGlowToken((t) => t + 1);
    });
  }, [focusJarId, targetJarId, scrollToAnchor, anchorRef]);

  const onGlowComplete = useCallback(() => {
    router.setParams({ focusJar: undefined });
  }, [router]);

  return { glowToken, onGlowComplete };
}
