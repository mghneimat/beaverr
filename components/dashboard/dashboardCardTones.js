import { C } from '../../constants/onboarding-theme';

/** Subtle tinted surfaces for dashboard snapshot cards — derived at call time for theme switches. */
export function getDashboardCardTones() {
  return {
    income: {
      bg: C.positiveBg,
      bgHover: C.positiveBorder,
      bgPressed: C.positiveBorder,
      border: C.positiveBorder,
      borderActive: C.positive,
      accent: C.positive,
      valueColor: C.positive,
      iconColor: C.positive,
    },
    expense: {
      bg: C.dangerBg,
      bgHover: C.dangerBorder,
      bgPressed: C.dangerBorder,
      border: C.dangerBorder,
      borderActive: C.danger,
      accent: C.danger,
      valueColor: C.danger,
      iconColor: C.danger,
    },
    goal: {
      bg: C.infoBg,
      bgHover: C.infoBorder,
      bgPressed: C.infoBorder,
      border: C.infoBorder,
      borderActive: C.accent,
      accent: C.accent,
      valueColor: C.accentPressed,
      iconColor: C.accent,
    },
    flexibility: {
      bg: C.surfaceTint,
      bgHover: C.bg,
      bgPressed: C.border,
      border: C.border,
      borderActive: C.primary,
      accent: C.primary,
      valueColor: C.primary,
      iconColor: C.primary,
    },
  };
}

/**
 * @param {'income'|'expense'|'goal'|'flexibility'|undefined} tone
 * @param {{ hovered: boolean, pressed: boolean }} state
 */
export function resolveDashboardCardTone(tone, { hovered, pressed }) {
  const tones = getDashboardCardTones();
  if (!tone || !tones[tone]) return null;
  const palette = tones[tone];
  return {
    backgroundColor: pressed ? palette.bgPressed : hovered ? palette.bgHover : palette.bg,
    borderColor: hovered || pressed ? palette.borderActive : palette.border,
    borderLeftWidth: 3,
    borderLeftColor: palette.accent,
    valueColor: palette.valueColor,
    iconColor: palette.iconColor,
  };
}
