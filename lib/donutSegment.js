export function polar(cx, cy, r, angleDeg) {
  'worklet';
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Small overlap between adjacent slices to hide anti-aliasing hairlines. */
export const DONUT_SEGMENT_OVERLAP_DEG = 0.4;

/**
 * Proportional donut arcs with closure correction on the last slice.
 * @returns {{ key: string, start: number, sweep: number, drawSweep: number }[]}
 */
export function buildDonutArcMeta(segments, total) {
  if (!total || !segments.length) return [];
  const count = segments.length;
  const overlap = count > 1 ? DONUT_SEGMENT_OVERLAP_DEG : 0;
  let angle = 0;

  return segments.map((seg, i) => {
    const isLast = i === count - 1;
    const sweep = isLast ? 360 - angle : (seg.value / total) * 360;
    const start = angle;
    angle += sweep;
    const drawSweep = sweep + overlap;
    return {
      key: seg.key,
      start,
      sweep,
      drawSweep,
    };
  });
}

function donutSegmentArc(cx, cy, outerR, innerR, startAngle, endAngle) {
  'worklet';
  const p1 = polar(cx, cy, outerR, startAngle);
  const p2 = polar(cx, cy, outerR, endAngle);
  const p3 = polar(cx, cy, innerR, endAngle);
  const p4 = polar(cx, cy, innerR, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

/** SVG annulus slice. Full 360° rings are split — a single arc degenerates at 360°. */
export function donutSegmentPath(cx, cy, outerR, innerR, startAngle, endAngle) {
  'worklet';
  const sweep = endAngle - startAngle;
  if (sweep >= 359.99) {
    const mid = startAngle + sweep / 2;
    return [
      donutSegmentArc(cx, cy, outerR, innerR, startAngle, mid),
      donutSegmentArc(cx, cy, outerR, innerR, mid, endAngle),
    ].join(' ');
  }
  return donutSegmentArc(cx, cy, outerR, innerR, startAngle, endAngle);
}
