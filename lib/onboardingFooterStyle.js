import { C } from '../constants/onboarding-theme';

/**
 * In-flow onboarding footer — sits below ScrollView in a flex column (no overlay).
 */
export function getOnboardingInFlowFooterStyle({ safeBottom = 0 } = {}) {
  return {
    flexShrink: 0,
    display: 'flex',
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: safeBottom,
  };
}
