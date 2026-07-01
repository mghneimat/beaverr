import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Circle, Fill, BlurMask } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import {
  INSIGHT_GLOW_BASE,
  INSIGHT_GLOW_BLOBS,
  INSIGHT_GLOW_DRIFTS,
  getInsightBlobLayout,
} from './insightSkiaGlowTokens';

function InsightGlowBlob({
  color,
  centerX,
  centerY,
  radius,
  driftDiameter,
  driftKey,
  opacity = 1,
  blur,
  animate,
}) {
  const drift = INSIGHT_GLOW_DRIFTS[driftKey];
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!animate || !drift) {
      progress.value = 0;
      return;
    }

    progress.value = withRepeat(
      withTiming(1, { duration: drift.duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      false,
    );
  }, [animate, drift, progress]);

  const diameter = driftDiameter;

  const cx = useDerivedValue(() => {
    if (!drift) return centerX;
    const translateX = interpolate(progress.value, [0, 0.5, 1], drift.tx) * diameter;
    return centerX + translateX;
  });

  const cy = useDerivedValue(() => {
    if (!drift) return centerY;
    const translateY = interpolate(progress.value, [0, 0.5, 1], drift.ty) * diameter;
    return centerY + translateY;
  });

  const r = useDerivedValue(() => {
    if (!drift) return radius;
    const scale = interpolate(progress.value, [0, 0.5, 1], drift.scale);
    return radius * scale;
  });

  return (
    <Circle cx={cx} cy={cy} r={r} color={color} opacity={opacity}>
      <BlurMask blur={blur} style="normal" />
    </Circle>
  );
}

/**
 * Skia animated glow wash — native iOS/Android, same layout as HTML reference.
 * @param {{ width: number, canvasHeight: number, animate?: boolean }} props
 */
export default function InsightGlowBackground({
  width,
  canvasHeight,
  animate = true,
}) {
  return (
    <Canvas style={{ ...StyleSheet.absoluteFillObject, width, height: canvasHeight }}>
      <Fill color={INSIGHT_GLOW_BASE} />

      {INSIGHT_GLOW_BLOBS.map((blob) => {
        const layout = getInsightBlobLayout(width, canvasHeight, blob);

        return (
          <InsightGlowBlob
            key={`${blob.left}-${blob.top}-${blob.color}`}
            color={blob.color}
            centerX={layout.centerX}
            centerY={layout.centerY}
            radius={layout.radius}
            driftDiameter={Math.max(layout.width, layout.height)}
            driftKey={layout.drift}
            blur={layout.blur}
            opacity={layout.opacity}
            animate={animate}
          />
        );
      })}
    </Canvas>
  );
}
