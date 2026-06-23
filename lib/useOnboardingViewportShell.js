import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { C } from '../constants/onboarding-theme';

const FOCUSABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const SCROLL_DEBOUNCE_MS = 90;
const FOCUS_OUT_MS = 120;
const FOCUS_OUT_KEYBOARD_MS = 420;
/** Nav + progress + breathing room above the field */
const TOP_INSET = 64;
/** iOS keyboard accessory bar + safe gap below the field */
const BOTTOM_INSET = 88;
const SCROLL_PADDING = 16;

function isFocusableElement(element) {
  return Boolean(element?.tagName && FOCUSABLE_TAGS.has(element.tagName));
}

function isDatePartElement(element) {
  if (!element?.closest) return false;
  return Boolean(element.closest('[data-date-part]'));
}

function isAmountInputElement(element) {
  if (!element?.closest) return false;
  return Boolean(element.closest('[data-amount-input]'));
}

function isAnotherFieldFocused() {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement;
  return isFocusableElement(active);
}

function isKeyboardLikelyOpen() {
  if (typeof window === 'undefined' || !window.visualViewport) return false;
  return window.visualViewport.height < window.innerHeight * 0.85;
}

function resetShellStyle(node) {
  if (!node?.setNativeProps) return;
  node.setNativeProps({
    style: {
      position: 'relative',
      top: 0,
      left: 0,
      width: '100%',
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible',
      zIndex: 1,
    },
  });
}

function applyViewportShellStyle(node) {
  if (!node?.setNativeProps || typeof window === 'undefined' || !window.visualViewport) return;
  const vv = window.visualViewport;
  node.setNativeProps({
    style: {
      position: 'fixed',
      top: vv.offsetTop,
      left: 0,
      width: vv.width,
      height: vv.height,
      flex: undefined,
      minHeight: undefined,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: C.bg,
      overflow: 'hidden',
      zIndex: 10,
    },
  });
}

function setFooterVisible(footerRef, visible) {
  const node = footerRef.current;
  if (!node?.setNativeProps) return;
  node.setNativeProps({
    style: visible
      ? { display: 'flex', flexShrink: 0 }
      : { display: 'none' },
  });
}

function getScrollElement(scrollRef) {
  const ref = scrollRef?.current;
  if (!ref) return null;
  if (typeof ref.getScrollableNode === 'function') {
    return ref.getScrollableNode();
  }
  if (typeof ref.getNativeScrollRef === 'function') {
    return ref.getNativeScrollRef()?.current ?? null;
  }
  return ref;
}

function readScrollY(scrollRef, scrollEl) {
  if (typeof scrollEl?.scrollTop === 'number') {
    return scrollEl.scrollTop;
  }
  return 0;
}

function writeScrollY(scrollRef, scrollEl, y) {
  const nextY = Math.max(0, y);
  if (scrollRef?.current?.scrollTo) {
    scrollRef.current.scrollTo({ y: nextY, animated: false });
    return;
  }
  if (scrollEl && typeof scrollEl.scrollTop === 'number') {
    scrollEl.scrollTop = nextY;
  }
}

/**
 * Scroll the inner ScrollView just enough to keep the focused field in the visible
 * viewport — one instant adjustment, no scrollIntoView (avoids nested-scroll bounce).
 */
function ensureFieldVisible(scrollRef) {
  if (typeof document === 'undefined' || !window.visualViewport) return;

  const active = document.activeElement;
  if (!isFocusableElement(active) || !active.getBoundingClientRect) return;
  if (isDatePartElement(active)) return;

  const scrollEl = getScrollElement(scrollRef);
  if (!scrollEl) return;

  const rect = active.getBoundingClientRect();
  const vv = window.visualViewport;
  const topLimit = vv.offsetTop + TOP_INSET;
  const bottomLimit = vv.offsetTop + vv.height - BOTTOM_INSET;

  const overflowBottom = rect.bottom - bottomLimit;
  const overflowTop = topLimit - rect.top;

  if (overflowBottom <= 0 && overflowTop <= 0) return;

  const delta = overflowBottom > 0
    ? overflowBottom + SCROLL_PADDING
    : -(overflowTop + SCROLL_PADDING);

  const currentY = readScrollY(scrollRef, scrollEl);
  writeScrollY(scrollRef, scrollEl, currentY + delta);
}

/**
 * Mobile-web onboarding shell — locks to visualViewport when keyboard opens, hides footer while typing.
 * Imperative DOM updates only (no React state) to avoid keyboard flash-dismiss.
 */
export function useOnboardingViewportShell({ enabled, shellRef, footerRef, scrollRef }) {
  const inputFocusedRef = useRef(false);
  const datePartFocusedRef = useRef(false);
  const keyboardOpenRef = useRef(false);
  const shellLockedRef = useRef(false);

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    let scrollTimer = null;
    let focusOutTimer = null;

    const cancelScheduledScroll = () => {
      if (scrollTimer != null) {
        window.clearTimeout(scrollTimer);
        scrollTimer = null;
      }
    };

    const cancelFocusOut = () => {
      if (focusOutTimer != null) {
        window.clearTimeout(focusOutTimer);
        focusOutTimer = null;
      }
    };

    const scheduleEnsureFieldVisible = (delay = SCROLL_DEBOUNCE_MS) => {
      if (datePartFocusedRef.current) return;
      cancelScheduledScroll();
      scrollTimer = window.setTimeout(() => {
        scrollTimer = null;
        if (!inputFocusedRef.current || datePartFocusedRef.current) return;
        if (!isAmountInputElement(document.activeElement)) return;
        ensureFieldVisible(scrollRef);
      }, delay);
    };

    const unlockShell = () => {
      if (!shellLockedRef.current) return;
      shellLockedRef.current = false;
      resetShellStyle(shellRef.current);
      setFooterVisible(footerRef, true);
    };

    const syncShellForKeyboard = () => {
      const open = isKeyboardLikelyOpen();
      keyboardOpenRef.current = open;

      if (open && inputFocusedRef.current && !datePartFocusedRef.current) {
        const active = document.activeElement;
        shellLockedRef.current = true;
        applyViewportShellStyle(shellRef.current);
        setFooterVisible(footerRef, false);
        scheduleEnsureFieldVisible(80);
        if (active && isAmountInputElement(active) && typeof active.focus === 'function') {
          requestAnimationFrame(() => active.focus());
        }
        return;
      }

      if (!open && !inputFocusedRef.current) {
        unlockShell();
      }
    };

    const onFocusIn = (event) => {
      if (!isFocusableElement(event.target)) return;
      cancelFocusOut();
      const isDatePart = isDatePartElement(event.target);
      inputFocusedRef.current = true;
      datePartFocusedRef.current = isDatePart;
    };

    const onViewportResize = () => {
      syncShellForKeyboard();
    };

    const onFocusOut = (event) => {
      if (isFocusableElement(event.relatedTarget)) {
        datePartFocusedRef.current = isDatePartElement(event.relatedTarget);
        inputFocusedRef.current = true;
        return;
      }

      cancelFocusOut();
      const delay = keyboardOpenRef.current ? FOCUS_OUT_KEYBOARD_MS : FOCUS_OUT_MS;
      focusOutTimer = window.setTimeout(() => {
        focusOutTimer = null;
        if (isAnotherFieldFocused()) return;
        cancelScheduledScroll();
        inputFocusedRef.current = false;
        datePartFocusedRef.current = false;
        keyboardOpenRef.current = false;
        unlockShell();
      }, delay);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    window.visualViewport?.addEventListener('resize', onViewportResize);
    window.addEventListener('resize', onViewportResize);

    return () => {
      cancelScheduledScroll();
      cancelFocusOut();
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      window.visualViewport?.removeEventListener('resize', onViewportResize);
      window.removeEventListener('resize', onViewportResize);
      inputFocusedRef.current = false;
      datePartFocusedRef.current = false;
      keyboardOpenRef.current = false;
      unlockShell();
    };
  }, [enabled, shellRef, footerRef, scrollRef]);
}
