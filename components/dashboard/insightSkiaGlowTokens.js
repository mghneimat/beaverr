import { P } from '../../constants/onboarding-theme';

/** Deep navy card base — rgb(20, 39, 78) from glow_mode_brand_blue_v3. */
export const INSIGHT_GLOW_BASE = P.light.navy900;

/** Brand blob palette — matches glow_mode_brand_blue_v3.html */
export const INSIGHT_GLOW_COLORS = {
  accent: P.light.blue600,
  light: '#60A5FA',
  transition: '#CBD5E1',
  core: P.light.blue50,
};

/** Reference card aspect ratio (320×420, 3:4). */
export const INSIGHT_GLOW_ASPECT = 4 / 3;

/**
 * CSS keyframe drift — translate % is relative to blob size, matching the HTML reference.
 * Each drift defines 0%/50%/100% keyframes (ease-in-out loop).
 */
export const INSIGHT_GLOW_DRIFTS = {
  drift1: {
    duration: 6000,
    tx: [-0.10, 0.15, -0.10],
    ty: [0.10, -0.05, 0.10],
    scale: [1, 1.15, 1],
  },
  drift2: {
    duration: 7000,
    tx: [0.10, -0.10, 0.10],
    ty: [0.15, -0.10, 0.15],
    scale: [1, 1.1, 1],
  },
  drift3: {
    duration: 5000,
    tx: [0, 0.05, 0],
    ty: [0.20, 0, 0.20],
    scale: [0.9, 1.2, 0.9],
  },
  drift4: {
    duration: 6500,
    tx: [-0.08, 0.08, -0.08],
    ty: [-0.08, 0.08, -0.08],
    scale: [1, 1.1, 1],
  },
};

/**
 * Blob layout — left/top/size as fractions of card width/height (glow_mode_brand_blue_v3.html).
 */
export const INSIGHT_GLOW_BLOBS = [
  {
    color: INSIGHT_GLOW_COLORS.accent,
    left: 0.08,
    top: 0.15,
    size: 0.60,
    blur: 40,
    drift: 'drift1',
  },
  {
    color: INSIGHT_GLOW_COLORS.light,
    left: 0.28,
    top: 0.38,
    size: 0.52,
    blur: 40,
    drift: 'drift2',
  },
  {
    color: INSIGHT_GLOW_COLORS.transition,
    left: 0.30,
    top: 0.55,
    size: 0.46,
    blur: 40,
    opacity: 0.85,
    drift: 'drift4',
  },
  {
    color: INSIGHT_GLOW_COLORS.core,
    left: 0.38,
    top: 0.68,
    size: 0.36,
    blur: 40,
    opacity: 0.9,
    drift: 'drift3',
  },
];

/** @deprecated Use INSIGHT_GLOW_BASE */
export const INSIGHT_SKIA_BASE = INSIGHT_GLOW_BASE;

/** @deprecated Use INSIGHT_GLOW_BLOBS */
export const INSIGHT_SKIA_BLOBS = INSIGHT_GLOW_BLOBS;

/**
 * Layout one blob on a virtual canvas (width × canvasHeight).
 * @param {number} width
 * @param {number} canvasHeight
 * @param {typeof INSIGHT_GLOW_BLOBS[number]} blob
 */
export function getInsightBlobLayout(width, canvasHeight, blob) {
  const blobWidth = width * blob.size;
  const blobHeight = canvasHeight * blob.size;
  const left = width * blob.left;
  const top = canvasHeight * blob.top;

  return {
    left,
    top,
    width: blobWidth,
    height: blobHeight,
    blur: blob.blur,
    opacity: blob.opacity ?? 1,
    drift: blob.drift,
    centerX: left + blobWidth / 2,
    centerY: top + blobHeight / 2,
    radius: Math.max(blobWidth, blobHeight) / 2,
  };
}

/** Virtual canvas height for the reference glow field. */
export function getInsightGlowCanvasHeight(width) {
  return width * INSIGHT_GLOW_ASPECT;
}
