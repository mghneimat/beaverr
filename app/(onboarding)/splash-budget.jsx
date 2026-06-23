import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import FinanceAppAmicoIllustration from '../../components/onboarding/FinanceAppAmicoIllustration';

/** Section 12 splash — Setup Budget */
export default function SplashBudgetScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-budget'),
    [],
  );

  return (
    <SplashScreen
      illustration={<FinanceAppAmicoIllustration width={layout.illustrationWidth} />}
      animationKey="splash-budget"
      heading={t('onboarding.s12.heading')}
      description={t('onboarding.s12.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/budget-setup')}
      onBack={handleBack}
      chapter={t('onboarding.budget.chapter')}
      resumeRoute="/(onboarding)/splash-budget"
    />
  );
}
