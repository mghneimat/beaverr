import { Platform } from 'react-native';
import { GENERAL_SANS_REGULAR, GENERAL_SANS_WORDMARK, GENERAL_SANS_VARIABLE, sansFontFamily, wordmarkTextStyle } from '../lib/fonts';
import { C, P } from './palette';
import { syncThemeTokens } from '../lib/theme/syncThemeTokens';

export { P, C } from './palette';

/** Typography token — maps weight to self-hosted General Sans file. */
function sansType({ fontWeight = '400', fontStyle, ...rest }) {
  const italic = fontStyle === 'italic';
  return {
    ...rest,
    fontFamily: sansFontFamily(fontWeight, { italic }),
    fontWeight: '400',
  };
}

/**
 * Onboarding UI design tokens — single source of truth for all inline styles
 * used across onboarding question screens, splash screens, and shared components.
 *
 * Updated to match the blue/navy design system from UI Examples (Screens 2, 5, 6).
 * Layer 1 primitives + Layer 2 semantics live in constants/palette.js (P, C).
 * This file re-exports P/C and adds typography, spacing, radius, shadows.
 *
 * Rule: No onboarding component may hardcode a colour, radius, font size, or
 * spacing value that is defined here. Import from this file instead.
 *
 * @see gluestack-ui.config.js
 */

// ── Radius (unified soft roundness — card, input, chip share 22px; buttons pill) ─
export const R = {
  input:   22,   // TextInput, OptionCard, nav panels
  card:    22,   // SurfaceCard, dialogs
  button:  99,   // Primary / outline CTAs (full pill)
  pill:    99,   // Progress bar fill, filter chips, capsule inputs
  chip:    16,   // Suggestion chips, quick-add
};

/** OptionCard — fixed row height so label-only and label+subtitle cards align. */
export const OPTION_CARD = {
  minHeight:         72,
  paddingVertical:   16,
  paddingHorizontal: 18,
  labelLineHeight:   20,
  subtitleLineHeight: 18,
  subtitleMarginTop: 2,
  /** Reserved second line when no subtitle prop (label-only cards). */
  subtitleSlotHeight: 20,
};

/** Text fields — compact pill height; OptionCard rows stay taller for choice tap targets. */
export const INPUT_FIELD = {
  minHeight:         56,
  paddingVertical:   12,
  paddingHorizontal: OPTION_CARD.paddingHorizontal,
};

/** +/- quantity stepper — matches INPUT_FIELD height, pill outline. */
export const STEPPER = {
  height:        INPUT_FIELD.minHeight,
  stepWidth:     64,
  valueMinWidth: 88,
};

// ── Font families (loaded in app/_layout.jsx) ─────────────────────────────────
export const F = {
  sans: GENERAL_SANS_REGULAR,
  /** Brand wordmark — General Sans Bold Italic (variable on web) */
  wordmark: GENERAL_SANS_WORDMARK,
  /** Variable upright — optional fine weight tuning on web */
  variable: GENERAL_SANS_VARIABLE,
};

// ── Typography (fixed product scale: 12 / 13 / 15 / 24 / 28 / 40) ───────────
export const T = {
  questionTitle:   sansType({ fontSize: 24, lineHeight: 32, fontWeight: '700', color: C.text }),
  helper:          sansType({ fontSize: 15, lineHeight: 23, color: C.muted, fontWeight: '400' }),

  splashHeading:   sansType({ fontSize: 28, lineHeight: 34, fontWeight: '700', color: C.text }),
  splashBody:      sansType({ fontSize: 15, lineHeight: 24, color: C.muted, fontWeight: '400' }),
  eyebrow:         sansType({ fontSize: 12, fontWeight: '500', color: C.muted }),

  fieldLabel:      sansType({ fontSize: 13, fontWeight: '500', color: C.muted }),
  cardTitle:       sansType({ fontSize: 17, fontWeight: '600', color: C.text }),
  sectionLabel:    sansType({ fontSize: 12, fontWeight: '500', color: C.muted }),
  caption:         sansType({ fontSize: 12, lineHeight: 18, fontWeight: '400' }),
  hint:            sansType({ fontSize: 12, lineHeight: 18, color: C.muted, fontWeight: '400' }),

  inputText:       sansType({ fontSize: 17, fontWeight: '400', color: C.text }),
  inputLarge:      sansType({ fontSize: 28, fontWeight: '600', color: C.text }),

  btnPrimary:      sansType({ fontSize: 15, fontWeight: '500' }),
  btnSkip:         sansType({ fontSize: 13, color: C.muted, fontWeight: '400' }),
  btnAdd:          sansType({ fontSize: 14, fontWeight: '500', color: C.accent }),

  pillLabel:       sansType({ fontSize: 13, fontWeight: '500' }),
  pillLabelLarge:  sansType({ fontSize: 15, fontWeight: '500' }),
  pillLabelSmall:  sansType({ fontSize: 11, fontWeight: '400' }),

  backBtn:         sansType({ fontSize: 15, fontWeight: '400', color: C.muted }),
  chapterLabel:    sansType({ fontSize: 15, fontWeight: '500', color: C.text }),
  progressLabel:   sansType({ fontSize: 11, fontWeight: '500', color: C.muted }),

  displayBrand:    sansType({ fontSize: 40, lineHeight: 44, color: C.text, fontWeight: '400' }),
  welcomeBrand:    wordmarkTextStyle({ fontSize: 44, lineHeight: 48, color: C.text, letterSpacing: -0.4 }),
  welcomeTagline:  sansType({ fontSize: 18, lineHeight: 26, fontWeight: '500', color: C.text }),
  welcomeBody:     sansType({ fontSize: 15, lineHeight: 24, color: C.muted, fontWeight: '400' }),
};

/** Align currency figures in budget tables */
export const tabularNums = Platform.select({
  web: { fontVariantNumeric: 'tabular-nums' },
  default: { fontVariant: ['tabular-nums'] },
});

// ── Spacing ───────────────────────────────────────────────────────────────────
export const S = {
  pagePadH:        20,   // Horizontal page padding
  pagePadV:        24,   // Vertical page padding (top/bottom of content)
  cardPad:         20,   // Inner padding of elevated cards
  inputPadH:       18,   // Horizontal padding inside TextInput (matches OPTION_CARD)
  inputPadV:       16,   // Vertical padding inside TextInput (matches OPTION_CARD)
  fieldGap:        16,   // Gap between field groups
  toggleRevealGap: 24,   // Gap between Yes/No toggle and revealed input card
  labelGap:        6,    // Gap between label and input
  sectionGap:      24,   // Gap after helper text before input area
  tabContentGap:   32,   // Gap between tab title/helper and first section card
  tabSectionGap:   16,   // Gap between stacked sections on dashboard / app tabs
  tabSectionTightGap: 8, // Gap between closely related blocks (tab bar rows)
  inputGap:        8,    // Gap between stacked inputs inside a card
  pillPadV:        14,   // Vertical padding inside pill toggle
  pillPadVSmall:   10,   // Smaller pill vertical padding (inside cards)
  navHeight:       56,   // Fixed nav bar height
  progressHeight:  3,    // Progress bar track height
  progressPanel:   44,   // Animated progress panel total height
  maxWidth:        560,  // Max content column width
};

/** Inline undraw illustrations above headings — one width + spacing everywhere. */
export const ONBOARDING_ILLUSTRATION = {
  widthNarrow:  280,
  width:        320,
  marginBottom: 32,
  fadeDuration: 400,
  fadeTranslateY: 10,
};

/** Splash section headings — compact title above data-capture description. */
export const ONBOARDING_SPLASH_HEADING = {
  fontSize: 24,
  lineHeight: 32,
  fontSizeNarrow: 22,
  lineHeightNarrow: 28,
};

/** Splash intro cards — even copy block and illustration band height across sections. */
export const ONBOARDING_SPLASH = {
  /** ~5 lines at T.helper (15/23) when an illustration band is present. */
  descriptionMinHeight: 115,
  /** Text-only splashes — taller copy area to approximate illustrated card weight. */
  descriptionMinHeightNoIllustration: 161,
};

// ── Elevation (shadow OR border — not both on cards) ─────────────────────────
export const SHADOW = {
  card: Platform.select({
    web: { boxShadow: '0 2px 12px rgba(30, 58, 95, 0.07)' },
    default: {
      shadowColor: P.navy900,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 3,
    },
  }),
  button: Platform.select({
    web: { boxShadow: '0 2px 8px rgba(30, 58, 95, 0.18)' },
    default: {
      shadowColor: P.navy900,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 2,
    },
  }),
};

// ── Input base style (shared across all TextInput instances) ──────────────────
export const inputBase = {
  backgroundColor: C.surface,
  borderWidth: 1.5,
  borderColor: C.border,
  borderRadius: R.pill,
  paddingHorizontal: INPUT_FIELD.paddingHorizontal,
  paddingVertical: INPUT_FIELD.paddingVertical,
  minHeight: INPUT_FIELD.minHeight,
  color: C.text,
  ...T.inputText,
};

// ── Input base style for inputs inside cards (nested on white card) ───────────
export const inputCard = {
  backgroundColor: C.bg,
  borderWidth: 1.5,
  borderColor: C.border,
  borderRadius: R.input,
  paddingHorizontal: 14,
  paddingVertical: INPUT_FIELD.paddingVertical,
  minHeight: INPUT_FIELD.minHeight,
  fontSize: 15,
  color: C.text,
};

// ── Large numeric input (income, amounts) ─────────────────────────────────────
export const inputLarge = {
  ...inputBase,
  borderRadius: R.pill,
  paddingVertical: INPUT_FIELD.paddingVertical,
  minHeight: INPUT_FIELD.minHeight,
  ...T.inputLarge,
};

// ── Primary button ────────────────────────────────────────────────────────────
export const btnPrimary = (disabled, pressed) => ({
  paddingVertical: 16,
  paddingHorizontal: 28,
  borderRadius: R.button,
  backgroundColor: disabled ? C.disabled : pressed ? C.accentPressed : C.accent,
  alignItems: 'center',
  justifyContent: 'center',
  ...(disabled ? {} : SHADOW.button),
});

// ── Add-another dashed button ─────────────────────────────────────────────────
export const btnAdd = (pressed) => ({
  paddingVertical: 12,
  borderRadius: R.input,
  borderWidth: 2,
  borderColor: C.accent,
  borderStyle: 'dashed',
  alignItems: 'center',
  backgroundColor: pressed ? C.bg : 'transparent',
});

export const SVG = {
  primary: C.primary,
  accent: C.accent,
  positive: C.positive,
  surface: C.surface,
  border: C.border,
  bg: C.bg,
};

/**
 * Apply light/dark palette to mutable C, typography colors, shadows, and web DOM.
 * @param {'light' | 'dark'} mode
 */
export function applyActiveTheme(mode) {
  syncThemeTokens(mode, {
    T,
    SHADOW,
    SVG,
    inputBase,
    inputCard,
    sansType,
    wordmarkTextStyle,
  });
}
