import { Platform } from 'react-native';
import { applyPaletteToActiveColors, buildSemanticColors, C } from '../../constants/palette';

/** Keys on T that carry a theme-dependent color. */
const T_COLOR_KEYS = [
  'questionTitle', 'helper', 'splashHeading', 'splashBody', 'eyebrow',
  'fieldLabel', 'cardTitle', 'sectionLabel', 'hint', 'inputText', 'inputLarge',
  'btnSkip', 'btnAdd', 'backBtn', 'chapterLabel', 'progressLabel',
  'displayBrand', 'welcomeTagline', 'welcomeBody',
];

/**
 * Sync mutable design tokens after palette switch.
 * @param {'light' | 'dark'} mode
 * @param {{
 *   T: Record<string, object>,
 *   SHADOW: Record<string, object>,
 *   SVG: Record<string, string>,
 *   inputBase: Record<string, unknown>,
 *   inputCard: Record<string, unknown>,
 *   sansType: Function,
 *   wordmarkTextStyle: Function,
 * }} themeRefs
 */
export function syncThemeTokens(mode, themeRefs) {
  applyPaletteToActiveColors(mode);

  const { T, SHADOW, SVG, inputBase, inputCard, sansType, wordmarkTextStyle } = themeRefs;

  const textColorMap = {
    questionTitle: C.text,
    helper: C.muted,
    splashHeading: C.text,
    splashBody: C.muted,
    eyebrow: C.muted,
    fieldLabel: C.muted,
    cardTitle: C.text,
    sectionLabel: C.muted,
    hint: C.muted,
    inputText: C.text,
    inputLarge: C.text,
    btnSkip: C.muted,
    btnAdd: C.accent,
    backBtn: C.muted,
    chapterLabel: C.text,
    progressLabel: C.muted,
    displayBrand: C.text,
    welcomeTagline: C.text,
    welcomeBody: C.muted,
  };

  T_COLOR_KEYS.forEach((key) => {
    if (key === 'welcomeBrand') return;
    const color = textColorMap[key];
    if (color && T[key]) T[key].color = color;
  });

  if (T.welcomeBrand) {
    Object.assign(T.welcomeBrand, wordmarkTextStyle({
      fontSize: 44,
      lineHeight: 48,
      color: C.text,
      letterSpacing: -0.4,
    }));
  }

  const shadowRgb = mode === 'dark' ? '11, 18, 32' : '20, 39, 78';
  if (Platform.OS === 'web') {
    SHADOW.card = { boxShadow: `0 2px 12px rgba(${shadowRgb}, 0.07)` };
    SHADOW.button = { boxShadow: `0 2px 8px rgba(${shadowRgb}, 0.18)` };
  } else {
    SHADOW.card = {
      shadowColor: C.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 3,
    };
    SHADOW.button = {
      shadowColor: C.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 2,
    };
  }

  Object.assign(SVG, {
    primary: C.primary,
    accent: C.accent,
    positive: C.positive,
    surface: C.surface,
    border: C.border,
    bg: C.bg,
  });

  Object.assign(inputBase, {
    backgroundColor: C.surface,
    borderColor: C.border,
    color: C.text,
  });

  Object.assign(inputCard, {
    backgroundColor: C.bg,
    borderColor: C.border,
    color: C.text,
  });

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.colorScheme = mode;
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.style.colorScheme = mode;
    document.documentElement.style.backgroundColor = C.bg;
    if (document.body) document.body.style.backgroundColor = C.bg;
  }
}

export function getBootLoaderTokens(mode = 'light') {
  const colors = buildSemanticColors(mode === 'dark' ? 'dark' : 'light');
  return { bg: colors.bg, accent: colors.accent };
}
