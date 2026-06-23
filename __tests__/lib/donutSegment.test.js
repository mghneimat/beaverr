import { donutSegmentPath, polar, buildDonutArcMeta } from '../../lib/donutSegment';

describe('donutSegmentPath', () => {
  it('returns a path for a full 360° ring (single source)', () => {
    const path = donutSegmentPath(114, 114, 96, 62, 0, 360);
    expect(path).toBeTruthy();
    expect(path).toContain('M ');
    expect(path).toContain('A ');
    expect(path).toContain('Z');
  });

  it('returns a path for a partial slice', () => {
    const path = donutSegmentPath(114, 114, 96, 62, 0, 90);
    expect(path).toBeTruthy();
  });
});

describe('polar', () => {
  it('maps 0° and 360° to the same point at 12 o\'clock', () => {
    const atZero = polar(100, 100, 50, 0);
    const atFull = polar(100, 100, 50, 360);
    expect(atZero.x).toBeCloseTo(atFull.x, 5);
    expect(atZero.y).toBeCloseTo(atFull.y, 5);
    expect(atZero.y).toBeLessThan(100);
  });
});

describe('buildDonutArcMeta', () => {
  it('sums sweeps to exactly 360°', () => {
    const segments = [
      { key: 'a', value: 22943 },
      { key: 'b', value: 1478 },
    ];
    const total = 24421;
    const arcs = buildDonutArcMeta(segments, total);
    const sum = arcs.reduce((acc, arc) => acc + arc.sweep, 0);
    expect(sum).toBeCloseTo(360, 5);
    expect(arcs[arcs.length - 1].start + arcs[arcs.length - 1].sweep).toBeCloseTo(360, 5);
  });
});
