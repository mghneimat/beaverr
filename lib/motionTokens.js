/** Pure motion tokens — safe to import from lib code and Jest tests (no Reanimated). */

export const ENTER_DURATION_MS = 260;
export const ENTER_TRANSLATE_Y = 10;

export const DASHBOARD_MOTION_DURATION = 280;
export const DASHBOARD_MOTION_DURATION_FAST = 220;

export const DASHBOARD_ENTER = {
  forward: { opacity: 0, translateY: 18, translateX: 0 },
  back: { opacity: 0, translateY: -14, translateX: 0 },
  lateral: { opacity: 0, translateY: 8, translateX: 14 },
  detail: { opacity: 0, translateY: 0, translateX: 28 },
  detailBack: { opacity: 0, translateY: 0, translateX: -20 },
  none: { opacity: 0, translateY: ENTER_TRANSLATE_Y, translateX: 0 },
};

/** Simple fade-up preset (onboarding route enter, fallback app enter) */
export const ENTER_UP = { opacity: 0, translateY: ENTER_TRANSLATE_Y, translateX: 0 };

/** Income burn-rate bar — left-to-right segment fill */
export const BURN_RATE_SEGMENT_STAGGER_MS = 65;
export const BURN_RATE_SEGMENT_DURATION_MS = 500;

/** Legend rows — enter after bar begins filling */
export const BURN_RATE_ROW_STAGGER_MS = 48;
export const BURN_RATE_ROW_DURATION_MS = 260;
export const BURN_RATE_ROW_LEAD_MS = 180;

/** Amount cells — crossfade when display frequency changes */
export const BURN_RATE_AMOUNT_DURATION_MS = 220;

/** Settle crossfade — fade out, swap content, fade in (frequency toggle, page reveal) */
export const SETTLE_FADE_OUT_MS = 140;
export const SETTLE_FADE_IN_MS = ENTER_DURATION_MS;
export const SETTLE_FADE_Y = 8;

/** Navy showcase sections — fade up on tab/page enter */
export const SHOWCASE_ENTER_DURATION_MS = 340;
export const SHOWCASE_ENTER = { opacity: 0, translateY: 20, scale: 0.98 };

/** Jar grid cells — stagger in when rollover strategy changes visible jars */
export const JAR_GRID_STAGGER_MS = 55;
export const JAR_GRID_ENTER_DURATION_MS = 420;
export const JAR_GRID_EXIT_DURATION_MS = 260;
export const JAR_GRID_ENTER = { opacity: 0.4, translateY: 10, scale: 0.985 };

/** Pay-cycle tile border — green/red conic gradient with settle on mode change */
export const CYCLE_BORDER_MODE_DURATION_MS = 420;
export const CYCLE_BORDER_SETTLE_MS = 420;
export const CYCLE_BORDER_SETTLE_DEG = 110;
export const CYCLE_BORDER_SPIN_DURATION_MS = 5000;
