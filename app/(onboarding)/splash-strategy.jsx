import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import BudgetingIllustration from '../../components/onboarding/BudgetingIllustration';

/** Strategy section splash — between Income & Savings and goal intents */
export default function SplashStrategyScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-strategy'),
    [],
  );

  return (
    <SplashScreen
      illustration={<BudgetingIllustration width={layout.illustrationWidth} />}
      animationKey="splash-strategy"
      heading={t('onboarding.strategy.splash.heading')}
      description={t('onboarding.strategy.splash.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/strategy')}
      onBack={handleBack}
      chapter={t('onboarding.strategy.chapter')}
    />
  );
}
