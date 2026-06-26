import { useEffect, useState, useCallback } from 'react';
import {
  getOnboardingState,
  getQuestionnairePercent,
  getQuestionnaireNavigationRoute,
  shouldShowQuestionnaireBanners,
  shouldShowQuestionnaireEstimateWarning,
} from './onboardingProgress';
import { subscribeDashboardRefresh } from './dashboardRefresh';

/**
 * Shared state for questionnaire-incomplete UI (layout banner + dashboard notice).
 */
export function useQuestionnaireBannerState() {
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const [navigationRoute, setNavigationRoute] = useState('');

  const [showEstimateWarning, setShowEstimateWarning] = useState(false);

  const load = useCallback(async () => {
    const state = await getOnboardingState();
    setVisible(shouldShowQuestionnaireBanners(state));
    setShowEstimateWarning(shouldShowQuestionnaireEstimateWarning(state));
    setPercent(getQuestionnairePercent(state));
    setNavigationRoute(getQuestionnaireNavigationRoute(state));
  }, []);

  useEffect(() => {
    load();
    return subscribeDashboardRefresh(load);
  }, [load]);

  return { visible, showEstimateWarning, percent, navigationRoute };
}
