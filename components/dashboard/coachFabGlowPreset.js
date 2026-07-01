/**
 * Ocean Sunset animated border for the Ask Beaverr FAB.
 * Colors match react-native-animated-glow `glowPresets.oceanSunset` defaults.
 * @see https://github.com/realimposter/react-native-animated-glow/blob/main/src/glow-presets.ts
 */

/** @typedef {{
 *   borderWidth: number,
 *   spinDurationMs: number,
 *   size: number,
 *   conicGradient: string,
 *   nativeBorderColor: string,
 *   webHalo: string | null,
 *   borderColors: string[],
 *   glowColors: string[],
 * }} CoachFabGlowPreset */

/** Original Ocean Sunset traveling border stops (pink → blue → orange). */
export const OCEAN_SUNSET_BORDER_COLORS = ['#FF7CAB', '#3F64C7', '#F0732E'];

/** Original Ocean Sunset outer glow layer hues. */
export const OCEAN_SUNSET_GLOW_COLORS = ['#f82fc6', '#5a4ff9', '#ff923e'];

/**
 * Even conic ring using the three Ocean Sunset border colors (120° each).
 * @param {string[]} [colors]
 */
export function buildOceanSunsetConicGradient(
  colors = OCEAN_SUNSET_BORDER_COLORS,
) {
  const [pink, blue, orange] = colors;
  return `conic-gradient(from 0deg, ${pink} 0deg, ${blue} 120deg, ${orange} 240deg, ${pink} 360deg)`;
}

/** @type {CoachFabGlowPreset} */
export const COACH_FAB_GLOW_PRESET = {
  borderWidth: 2,
  /** ~animationSpeed 2 from Ocean Sunset preset */
  spinDurationMs: 6000,
  size: 52,
  borderColors: OCEAN_SUNSET_BORDER_COLORS,
  glowColors: OCEAN_SUNSET_GLOW_COLORS,
  conicGradient: buildOceanSunsetConicGradient(),
  nativeBorderColor: OCEAN_SUNSET_BORDER_COLORS[1],
  webHalo:
    '0 0 16px rgba(255, 124, 171, 0.32), 0 0 24px rgba(63, 100, 199, 0.22), 0 0 12px rgba(240, 115, 46, 0.18)',
};

/**
 * @param {Partial<CoachFabGlowPreset>} [overrides]
 * @returns {CoachFabGlowPreset}
 */
export function getCoachFabGlowPreset(overrides = {}) {
  const merged = { ...COACH_FAB_GLOW_PRESET, ...overrides };
  if (overrides.borderColors) {
    merged.conicGradient = buildOceanSunsetConicGradient(overrides.borderColors);
  }
  return merged;
}
