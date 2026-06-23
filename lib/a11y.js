import { Platform } from 'react-native';
import { C } from '../constants/onboarding-theme';

/**
 * Visible keyboard focus ring for web fields (replaces zeroed outline).
 * Uses inset shadow so rings are not clipped by overflow:hidden parents (e.g. AnimatedCollapse).
 */
export function webFocusRing(focused, { invalid = false } = {}) {
  if (Platform.OS !== 'web' || !focused) return {};
  if (invalid) return { boxShadow: `inset 0 0 0 1.5px ${C.danger}` };
  return { boxShadow: `inset 0 0 0 1px ${C.accent}` };
}
