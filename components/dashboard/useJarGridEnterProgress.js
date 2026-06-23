import { useEffect } from 'react';
import {
  interpolate,
  runOnJS,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {
  DASHBOARD_MOTION_EASE,
  JAR_GRID_ENTER_DURATION_MS,
  JAR_GRID_EXIT_DURATION_MS,
  JAR_GRID_STAGGER_MS,
} from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Shared enter progress for jar grid cells / glass surfaces (rollover strategy change).
 * @param {string|null|undefined} enterKey — when null, stays at 1 (no enter)
 */
export function useJarGridEnterProgress(enterKey, index = 0) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(1);
  const enabled = enterKey != null;

  useEffect(() => {
    if (!enabled || reduceMotion) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = withDelay(
      index * JAR_GRID_STAGGER_MS,
      withTiming(1, { duration: JAR_GRID_ENTER_DURATION_MS, easing: DASHBOARD_MOTION_EASE }),
    );
  }, [enabled, enterKey, index, progress, reduceMotion]);

  return progress;
}

/**
 * Exit progress for removing a jar cell — runs 1 → 0 then calls onExitComplete.
 * @param {boolean} exiting
 * @param {(() => void)|undefined} onExitComplete
 */
export function useJarGridExitProgress(exiting, onExitComplete) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(1);

  useEffect(() => {
    if (!exiting) {
      progress.value = 1;
      return;
    }

    if (reduceMotion) {
      progress.value = 0;
      onExitComplete?.();
      return;
    }

    progress.value = withTiming(
      0,
      { duration: JAR_GRID_EXIT_DURATION_MS, easing: DASHBOARD_MOTION_EASE },
      (finished) => {
        if (finished && onExitComplete) {
          runOnJS(onExitComplete)();
        }
      },
    );
  }, [exiting, onExitComplete, progress, reduceMotion]);

  return progress;
}

/** Transform-only motion for grid cells — avoid opacity on backdrop-filter parents (web pop). */
export function jarGridCellTransformStyle(progress) {
  'worklet';
  return {
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [10, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.985, 1]) },
    ],
  };
}

/** Full motion for light stash cards — opacity + transform on exit. */
export function jarGridCellFullMotionStyle(progress) {
  'worklet';
  return {
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [8, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.96, 1]) },
    ],
  };
}
