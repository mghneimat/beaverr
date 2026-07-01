import { createElement } from 'react';
import { INSIGHT_GLOW_BASE, INSIGHT_GLOW_BLOBS } from './insightSkiaGlowTokens';

/**
 * Exact CSS replica of glow_mode_brand_blue_v3.html — div blobs + keyframe drift.
 * @param {{ width: number, canvasHeight: number, animate?: boolean }} props
 */
export default function InsightGlowBackground({
  width,
  canvasHeight,
  animate = true,
}) {
  return createElement(
    'div',
    {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height: canvasHeight,
        background: INSIGHT_GLOW_BASE,
        overflow: 'hidden',
      },
    },
    INSIGHT_GLOW_BLOBS.map((blob) => createElement('div', {
      key: `${blob.left}-${blob.top}-${blob.color}`,
      className: animate ? `insight-glow-blob insight-glow-${blob.drift}` : 'insight-glow-blob',
      style: {
        width: `${blob.size * 100}%`,
        height: `${blob.size * 100}%`,
        left: `${blob.left * 100}%`,
        top: `${blob.top * 100}%`,
        background: blob.color,
        opacity: blob.opacity ?? 1,
        animationPlayState: animate ? 'running' : 'paused',
      },
    })),
  );
}
