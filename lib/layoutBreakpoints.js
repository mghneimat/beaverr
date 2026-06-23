/** Phone-tier — card layouts, single-column grids, tighter padding. */
export const PHONE_MAX = 480;

/** App shell — sidebar drawer below this width. */
export const DASHBOARD_WIDE_BREAKPOINT = 768;

/** Tablet tier upper bound (alias of dashboard wide breakpoint). */
export const TABLET_MAX = DASHBOARD_WIDE_BREAKPOINT;

/**
 * @param {number} width
 * @returns {'phone' | 'tablet' | 'desktop'}
 */
export function getDeviceTier(width) {
  if (width < PHONE_MAX) return 'phone';
  if (width < TABLET_MAX) return 'tablet';
  return 'desktop';
}
