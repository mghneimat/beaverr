import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  cancelAnimation,
  runOnUI,
  useSharedValue,
} from 'react-native-reanimated';
import { CYCLE_BORDER_SPIN_DURATION_MS } from '../../../lib/dashboardMotion';
import { useReducedMotion } from '../../../lib/useReducedMotion';
import { startContinuousSpin } from './cycleGradientBorderShared';

/** Continuous conic spin — one clock; offset phase per tile via spinPhaseDeg on the shell. */
export function useSpinningBorder() {
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);
  const spinEnabled = Platform.OS === 'web' && !reduceMotion;

  useEffect(() => {
    if (!spinEnabled) {
      cancelAnimation(rotation);
      rotation.value = 0;
      return;
    }
    runOnUI(startContinuousSpin)(rotation, CYCLE_BORDER_SPIN_DURATION_MS);
  }, [spinEnabled, rotation]);

  return { spinEnabled, rotation };
}
