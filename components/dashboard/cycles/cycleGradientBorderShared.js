import {
  cancelAnimation,
  Easing,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DASHBOARD_MOTION_EASE } from '../../../lib/dashboardMotion';

/** Card + CTA ring — green / red; idle ring mostly #317325 with a wide mint blend wedge */
export const GRADIENT_IDLE =
  'conic-gradient(from 0deg, #317325 0deg, #317325 225deg, #3a872c 255deg, #bbf7d0 285deg, #86efac 315deg, #bbf7d0 345deg, #317325 360deg)';
export const GRADIENT_ACTIVE =
  'conic-gradient(from 0deg, #c02b33, #fecaca, #9a2329, #fecaca, #c02b33)';

/** One-off / recurring tiles — grey income column */
export const GRADIENT_GREY =
  'conic-gradient(from 0deg, #94a3b8 0deg, #94a3b8 225deg, #b8c4d4 255deg, #d1dcf0 285deg, #e8edf5 315deg, #d1dcf0 345deg, #94a3b8 360deg)';

/** One-off / recurring tiles — red expense column */
export const GRADIENT_RED =
  'conic-gradient(from 0deg, #c02b33 0deg, #c02b33 225deg, #d1353d 255deg, #fecaca 285deg, #fca5a5 315deg, #fecaca 345deg, #c02b33 360deg)';

/** AI insight card — same wedge structure as GRADIENT_GREY, brand blue */
export const GRADIENT_INSIGHT =
  'conic-gradient(from 0deg, #b8cce8 0deg, #b8cce8 225deg, #93c5fd 255deg, #bfdbfe 285deg, #1d4ed8 315deg, #bfdbfe 345deg, #b8cce8 360deg)';

export const TILE_GRADIENTS = {
  grey: GRADIENT_GREY,
  red: GRADIENT_RED,
  insight: GRADIENT_INSIGHT,
};

/** Button ring — same hues only, no dark navy/deep red that clip badly on pills */
export const GRADIENT_IDLE_BUTTON =
  'conic-gradient(from 0deg, #317325 0deg, #317325 225deg, #3a872c 255deg, #bbf7d0 285deg, #86efac 315deg, #bbf7d0 345deg, #317325 360deg)';
export const GRADIENT_ACTIVE_BUTTON =
  'conic-gradient(from 0deg, #c02b33, #fecaca, #d1353d, #fca5a5, #c02b33)';

export const GRADIENT_SETS = {
  card: { idle: GRADIENT_IDLE, active: GRADIENT_ACTIVE },
  button: { idle: GRADIENT_IDLE_BUTTON, active: GRADIENT_ACTIVE_BUTTON },
};

export const SETTLE_SPIN_EASE = Easing.bezier(0.22, 1, 0.36, 1);

export const GRADIENT_LAYER = {
  position: 'absolute',
  width: '250%',
  height: '250%',
  left: '-75%',
  top: '-75%',
  zIndex: 0,
};

/** Larger spin layer for pill CTAs — avoids cap gaps while rotating */
export const GRADIENT_LAYER_PILL = {
  position: 'absolute',
  width: '400%',
  height: '400%',
  left: '-150%',
  top: '-150%',
  zIndex: 0,
};

export function startContinuousSpin(rotation, steadyMs) {
  'worklet';
  cancelAnimation(rotation);
  const current = rotation.value;
  rotation.value = withRepeat(
    withTiming(current + 360, {
      duration: steadyMs,
      easing: Easing.linear,
    }),
    -1,
    false,
  );
}

export function triggerSettleSpin(rotation, settleDeg, settleMs, steadyMs) {
  'worklet';
  cancelAnimation(rotation);
  const current = rotation.value;
  rotation.value = withSequence(
    withTiming(current + settleDeg, {
      duration: settleMs,
      easing: SETTLE_SPIN_EASE,
    }),
    withRepeat(
      withTiming(current + settleDeg + 360, {
        duration: steadyMs,
        easing: Easing.linear,
      }),
      -1,
      false,
    ),
  );
}

export function triggerCardSettle(cardSettle, duration) {
  'worklet';
  cancelAnimation(cardSettle);
  cardSettle.value = withSequence(
    withTiming(3.5, {
      duration: duration * 0.35,
      easing: Easing.out(Easing.quad),
    }),
    withTiming(-1.25, {
      duration: duration * 0.35,
      easing: Easing.inOut(Easing.quad),
    }),
    withTiming(0, {
      duration: duration * 0.3,
      easing: DASHBOARD_MOTION_EASE,
    }),
  );
}
