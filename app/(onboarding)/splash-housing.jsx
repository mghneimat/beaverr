import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import ComingHomeIllustration from '../../components/onboarding/ComingHomeIllustration';

/** Section 4 splash — Housing */
export default function SplashHousingScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-housing'),
    [],
  );

  return (
    <SplashScreen
      illustration={<ComingHomeIllustration width={layout.illustrationWidth} />}
      animationKey="splash-housing"
      heading={t('onboarding.s4.heading')}
      description={t('onboarding.s4.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/housing')}
      onBack={handleBack}
      chapter={t('onboarding.housing.chapter')}
    />
  );
}
