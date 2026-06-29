import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useDashboardScroll } from '../../lib/dashboardScroll';

/**
 * Scroll to a dashboard section anchor and trigger a one-shot glow after scroll settles.
 * @param {string|null|undefined} focusSection
 * @param {string} targetSectionId
 * @param {import('react').RefObject<import('react-native').View>} anchorRef
 */
export function useSectionFocusHighlight(focusSection, targetSectionId, anchorRef) {
  const { scrollToAnchor } = useDashboardScroll();
  const router = useRouter();
  const [glowToken, setGlowToken] = useState(0);

  useEffect(() => {
    if (!focusSection || focusSection !== targetSectionId) return;

    scrollToAnchor(anchorRef, 32, () => {
      setGlowToken((t) => t + 1);
    });
  }, [focusSection, targetSectionId, scrollToAnchor, anchorRef]);

  const onGlowComplete = useCallback(() => {
    router.setParams({ focusSection: undefined });
  }, [router]);

  return { glowToken, onGlowComplete };
}
