/**
 * @deprecated Import { P, C, PALETTES } from './palette.js' instead.
 */
export { P, C as ColorsLight, PALETTES } from './palette';
import { C, PALETTES } from './palette';

export const Colors = {
  light: {
    bg: PALETTES.light.bg,
    surface: PALETTES.light.surface,
    primary: PALETTES.light.primary,
    primaryHover: PALETTES.light.primaryPressed,
    accent: PALETTES.light.accent,
    accentHover: PALETTES.light.accentPressed,
    positive: PALETTES.light.positive,
    warning: PALETTES.light.cycleWarning,
    danger: PALETTES.light.danger,
    debt: PALETTES.light.debt,
    text: PALETTES.light.text,
    muted: PALETTES.light.muted,
    border: PALETTES.light.border,
    divider: PALETTES.light.border,
    chipActive: PALETTES.light.overlaySelected,
    chipActiveBorder: PALETTES.light.primary,
  },
  dark: {
    bg: PALETTES.dark.bg,
    surface: PALETTES.dark.surface,
    primary: PALETTES.dark.primary,
    primaryHover: PALETTES.dark.primaryPressed,
    accent: PALETTES.dark.accent,
    accentHover: PALETTES.dark.accentPressed,
    positive: PALETTES.dark.positive,
    warning: PALETTES.dark.cycleWarning,
    danger: PALETTES.dark.danger,
    debt: PALETTES.dark.debt,
    text: PALETTES.dark.text,
    muted: PALETTES.dark.muted,
    border: PALETTES.dark.border,
    divider: PALETTES.dark.border,
    chipActive: PALETTES.dark.overlaySelected,
    chipActiveBorder: PALETTES.dark.primary,
  },
};
