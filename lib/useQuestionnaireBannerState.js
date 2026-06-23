import { useEffect, useState, useCallback } from 'react';
import {
  getOnboardingState,
  getQuestionnairePercent,
  getQuestionnaireNavigationRoute,
  shouldShowQuestionnaireBanners,
} from './onboardingProgress';
import { subscribeDashboardRefresh } from './dashboardRefresh';

/**
 * Shared state for questionnaire-incomplete UI (layout banner + dashboard notice).
 */
export function useQuestionnaireBannerState() {
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const [navigationRoute, setNavigationRoute] = useState('');

  const load = useCallback(async () => {
    const state = await getOnboardingState();
    setVisible(shouldShowQuestionnaireBanners(state));
    setPercent(getQuestionnairePercent(state));
    setNavigationRoute(getQuestionnaireNavigationRoute(state));
  }, []);

  useEffect(() => {
    load();
    return subscribeDashboardRefresh(load);
  }, [load]);

  return { visible, percent, navigationRoute };
}
