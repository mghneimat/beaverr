import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 10 splash — Other Costs */
export default function SplashOtherCostsScreen() {
  const { t } = useI18n();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-other-costs'),
    [],
  );

  return (
    <SplashScreen
      heading={t('onboarding.s10.heading')}
      description={t('onboarding.s10.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/splash-debts')}
      onBack={handleBack}
      chapter={t('onboarding.otherCosts.chapter')}
    />
  );
}
