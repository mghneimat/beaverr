import { createContext, useCallback, useContext } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * @typedef {Object} OnboardingScrollContextValue
 * @property {import('react').RefObject<import('react-native').ScrollView>} scrollRef
 * @property {import('react').RefObject<import('react-native').View>} contentRef
 * @property {(anchorRef: import('react').RefObject<import('react-native').View>) => void} scrollToAnchor
 */

/** @type {import('react').Context<OnboardingScrollContextValue | null>} */
export const OnboardingScrollContext = createContext(null);

/**
 * Scroll onboarding content to top when the screen or step changes.
 * @param {import('react').RefObject<import('react-native').ScrollView>} scrollRef
 * @param {string|number|undefined} resetKey
 */
export function useOnboardingScrollToTop(scrollRef, resetKey) {
  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [scrollRef]);

  useFocusEffect(
    useCallback(() => {
      scrollToTop();
      return undefined;
    }, [scrollToTop, resetKey]),
  );
}

/**
 * Scroll helper for onboarding screens — measures anchor position inside QuestionScreen content.
 * @returns {OnboardingScrollContextValue}
 */
export function useOnboardingScroll() {
  const ctx = useContext(OnboardingScrollContext);
  if (!ctx) {
    return { scrollRef: { current: null }, contentRef: { current: null }, scrollToAnchor: () => {} };
  }
  return ctx;
}
