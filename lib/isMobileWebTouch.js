import { Platform } from 'react-native';

function hasTouchInput() {
  if (typeof window === 'undefined') return false;
  if ('ontouchstart' in window) return true;
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return true;
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(pointer: coarse)').matches;
  }
  return false;
}

/** Phone-sized touch browsers (mobile web keyboard quirks). */
export function isMobileWebTouch() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const width = window.visualViewport?.width ?? window.innerWidth;
  return width < 768 && hasTouchInput();
}

/** Any touch-capable web browser (tablet / phone). */
export function isTouchWeb() {
  if (Platform.OS !== 'web') return false;
  return hasTouchInput();
}
