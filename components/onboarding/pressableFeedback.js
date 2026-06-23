import { C } from '../../constants/onboarding-theme';

/** Light wash for generic rows, steppers, skip links. */
export function washBg({ pressed, hovered }, base = 'transparent') {
  if (pressed) return C.overlayPressed;
  if (hovered) return C.overlayHover;
  return base;
}

/** Dashed add / skip actions. */
export function addButtonBg({ pressed, hovered }) {
  if (pressed || hovered) return C.addPressed;
  return 'transparent';
}

/** Modal / dropdown list rows. */
export function listRowBg({ pressed, hovered, selected, selectedBg = C.navSelectedBg }) {
  if (selected) return selectedBg;
  if (pressed) return C.bg;
  if (hovered) return C.overlayHover;
  return 'transparent';
}

/** Radio-style setup cards. */
export function choiceCardBg({ pressed, hovered, selected, selectedBg = C.navSelectedBg }) {
  if (selected) return selectedBg;
  if (pressed || hovered) return C.overlayHover;
  return C.surface;
}

export function choiceCardBorder({ hovered, selected, selectedBorder = C.primary }) {
  if (selected) return selectedBorder;
  if (hovered) return C.navSelectedBorder;
  return C.border;
}

/** Suggestion / export chips (inactive). */
export function chipBg({ pressed, hovered, active, activeBg = C.selectedBg }) {
  if (active) return activeBg;
  if (pressed || hovered) return C.surfaceTint;
  return C.surface;
}

/** Text-only secondary actions (skip, finish later). */
export function skipOpacity({ pressed, hovered }) {
  if (pressed) return 0.7;
  if (hovered) return 0.85;
  return 1;
}
