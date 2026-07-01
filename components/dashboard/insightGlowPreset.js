import { P } from '../../constants/onboarding-theme';

/** Subtle navy veil so prose stays readable over bright glow blobs. */
export const INSIGHT_CONTENT_SCRIM = 'rgba(15, 23, 42, 0.52)';

/** Legibility on animated glow — works on native + web. */
export const INSIGHT_TEXT_SHADOW = {
  textShadowColor: 'rgba(8, 15, 35, 0.9)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};

/** Copy tokens for light text on the navy Skia insight card. */
export function getInsightCardCopy() {
  return {
    title: P.light.white,
    body: P.light.white,
    muted: 'rgba(255, 255, 255, 0.9)',
    accent: '#BAE6FD',
    textShadow: INSIGHT_TEXT_SHADOW,
  };
}
