import { Platform } from 'react-native';

const DEFAULT_BOTTOM = 24;
const SNACKBAR_CLEARANCE = 56;

/**
 * Bottom inset for fixed UI on mobile web (home indicator).
 */
export function webSafeAreaBottom(fallback = DEFAULT_BOTTOM) {
  if (Platform.OS !== 'web') return fallback;
  return `max(${fallback}px, env(safe-area-inset-bottom, 0px))`;
}

/** Scroll content padding — base pad + snackbar clearance + safe area on web. */
export function webScrollBottomPadding(basePad = 24) {
  const total = basePad + SNACKBAR_CLEARANCE;
  if (Platform.OS !== 'web') return total;
  return `calc(${total}px + env(safe-area-inset-bottom, 0px))`;
}
