import { createContext, useContext } from 'react';

/** @typedef {import('react').RefObject<import('react-native').ScrollView>} ScrollRef */
/** @typedef {import('react').RefObject<import('react-native').View>} ViewRef */

/** Fallback when momentum scroll-end does not fire (web / zero-distance scroll). */
export const DASHBOARD_SCROLL_COMPLETE_FALLBACK_MS = 520;

/**
 * @typedef {Object} DashboardScrollContextValue
 * @property {ScrollRef} scrollRef
 * @property {ViewRef} contentRef
 * @property {(anchorRef: ViewRef, offset?: number, onComplete?: () => void) => void} scrollToAnchor
 * @property {() => void} notifyScrollComplete
 */

/** @type {import('react').Context<DashboardScrollContextValue | null>} */
export const DashboardScrollContext = createContext(null);

const NOOP = () => {};

/**
 * Scroll helper for dashboard tab pages — measures anchor position inside page shell content.
 * @returns {DashboardScrollContextValue}
 */
export function useDashboardScroll() {
  const ctx = useContext(DashboardScrollContext);
  if (!ctx) {
    return {
      scrollRef: { current: null },
      contentRef: { current: null },
      scrollToAnchor: NOOP,
      notifyScrollComplete: NOOP,
    };
  }
  return ctx;
}

/**
 * @param {ScrollRef} scrollRef
 * @param {ViewRef} contentRef
 * @param {(onComplete: () => void) => void} registerScrollComplete
 * @returns {DashboardScrollContextValue['scrollToAnchor']}
 */
export function createDashboardScrollToAnchor(scrollRef, contentRef, registerScrollComplete) {
  return (anchorRef, offset = 24, onComplete) => {
    setTimeout(() => {
      if (!anchorRef?.current || !scrollRef.current || !contentRef.current) {
        onComplete?.();
        return;
      }

      const runScroll = (y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - offset), animated: true });
        if (onComplete) {
          registerScrollComplete(onComplete);
        }
      };

      anchorRef.current.measureLayout(
        contentRef.current,
        (_x, y) => runScroll(y),
        () => {
          anchorRef.current?.measureInWindow((_ax, anchorY) => {
            contentRef.current?.measureInWindow((_cx, contentY) => {
              runScroll(anchorY - contentY);
            });
          });
        },
      );
    }, 320);
  };
}

/**
 * Register a one-shot callback for when the active animated scroll settles.
 * @returns {{ register: (onComplete: () => void) => void, notify: () => void, cleanup: () => void }}
 */
export function createDashboardScrollCompleteRegistry() {
  /** @type {(() => void)|null} */
  let pending = null;
  /** @type {ReturnType<typeof setTimeout>|null} */
  let fallbackTimer = null;

  const clearFallback = () => {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  };

  const finish = () => {
    if (!pending) return;
    clearFallback();
    const cb = pending;
    pending = null;
    cb();
  };

  return {
    register(onComplete) {
      clearFallback();
      pending = onComplete;
      fallbackTimer = setTimeout(finish, DASHBOARD_SCROLL_COMPLETE_FALLBACK_MS);
    },
    notify: finish,
    cleanup: () => {
      clearFallback();
      pending = null;
    },
  };
}
