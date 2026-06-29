import { useEffect, useState, useCallback } from 'react';
import {
  getOnboardingState,
  shouldShowContinueQuestionnaire,
  shouldShowQuestionnaireBanners,
} from './onboardingProgress';
import { subscribeDashboardRefresh } from './dashboardRefresh';

/**
 * Shared state for questionnaire-incomplete UI (layout banner + dashboard notice).
 */
export function useQuestionnaireBannerState() {
  const [visible, setVisible] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  const load = useCallback(async () => {
    const state = await getOnboardingState();
    setVisible(shouldShowQuestionnaireBanners(state));
    setShowContinue(shouldShowContinueQuestionnaire(state));
  }, []);

  useEffect(() => {
    load();
    return subscribeDashboardRefresh(load);
  }, [load]);

  return { visible, showContinue };
}
