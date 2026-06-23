import { Platform } from 'react-native';

/** Primary UI sans — regular weight file (expo-font family name). */
export const GENERAL_SANS_REGULAR = 'GeneralSans-Regular';

export const GENERAL_SANS_ITALIC = 'GeneralSans-Italic';

export const GENERAL_SANS_VARIABLE = 'GeneralSans-Variable';

export const GENERAL_SANS_VARIABLE_ITALIC = 'GeneralSans-VariableItalic';

/**
 * Beaverr wordmark stem — General Sans Bold Italic (variable on web).
 */
export const GENERAL_SANS_WORDMARK = Platform.select({
  web: GENERAL_SANS_VARIABLE_ITALIC,
  default: 'GeneralSans-BoldItalic',
});

/** Full General Sans family — self-hosted TTF for Vercel static export. */
export const generalSansFontAssets = {
  'GeneralSans-Extralight': require('../assets/fonts/GeneralSans-Extralight.ttf'),
  'GeneralSans-ExtralightItalic': require('../assets/fonts/GeneralSans-ExtralightItalic.ttf'),
  'GeneralSans-Light': require('../assets/fonts/GeneralSans-Light.ttf'),
  'GeneralSans-LightItalic': require('../assets/fonts/GeneralSans-LightItalic.ttf'),
  'GeneralSans-Regular': require('../assets/fonts/GeneralSans-Regular.ttf'),
  'GeneralSans-Italic': require('../assets/fonts/GeneralSans-Italic.ttf'),
  'GeneralSans-Medium': require('../assets/fonts/GeneralSans-Medium.ttf'),
  'GeneralSans-MediumItalic': require('../assets/fonts/GeneralSans-MediumItalic.ttf'),
  'GeneralSans-Semibold': require('../assets/fonts/GeneralSans-Semibold.ttf'),
  'GeneralSans-SemiboldItalic': require('../assets/fonts/GeneralSans-SemiboldItalic.ttf'),
  'GeneralSans-Bold': require('../assets/fonts/GeneralSans-Bold.ttf'),
  'GeneralSans-BoldItalic': require('../assets/fonts/GeneralSans-BoldItalic.ttf'),
  'GeneralSans-Variable': require('../assets/fonts/GeneralSans-Variable.ttf'),
  'GeneralSans-VariableItalic': require('../assets/fonts/GeneralSans-VariableItalic.ttf'),
};

/**
 * Map weight/style to a loaded General Sans file.
 * @param {string|number} [fontWeight='400']
 * @param {{ italic?: boolean }} [options]
 */
export function sansFontFamily(fontWeight = '400', { italic = false } = {}) {
  const w = String(fontWeight).toLowerCase();

  if (italic) {
    if (w === '700' || w === 'bold') return 'GeneralSans-BoldItalic';
    if (w === '600') return 'GeneralSans-SemiboldItalic';
    if (w === '500') return 'GeneralSans-MediumItalic';
    if (w === '300' || w === 'light') return 'GeneralSans-LightItalic';
    if (w === '200' || w === 'extralight') return 'GeneralSans-ExtralightItalic';
    return GENERAL_SANS_ITALIC;
  }

  if (w === '700' || w === 'bold') return 'GeneralSans-Bold';
  if (w === '600') return 'GeneralSans-Semibold';
  if (w === '500') return 'GeneralSans-Medium';
  if (w === '300' || w === 'light') return 'GeneralSans-Light';
  if (w === '200' || w === 'extralight') return 'GeneralSans-Extralight';
  return GENERAL_SANS_REGULAR;
}

/** Shared Beaverr wordmark styles (sidebar + welcome). */
export function wordmarkTextStyle(extra = {}) {
  const family = GENERAL_SANS_WORDMARK;
  const isVariable = family === GENERAL_SANS_VARIABLE_ITALIC;
  return {
    ...extra,
    fontFamily: family,
    ...(isVariable ? { fontWeight: '700', fontStyle: 'italic' } : {}),
  };
}

/** Trailing “r” — medium italic, lighter brand tone. */
export const WORDMARK_TAIL_COLOR = '#6B8CAE';

export function wordmarkTailTextStyle(extra = {}) {
  const { color = WORDMARK_TAIL_COLOR, ...rest } = extra;
  const isVariableItalic = Platform.OS === 'web';
  return {
    fontFamily: isVariableItalic ? GENERAL_SANS_VARIABLE_ITALIC : sansFontFamily('500', { italic: true }),
    ...(isVariableItalic ? { fontWeight: '500', fontStyle: 'italic' } : {}),
    color,
    ...rest,
  };
}
