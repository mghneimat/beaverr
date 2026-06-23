import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import LocationWorldIllustration from '../../components/onboarding/LocationWorldIllustration';

/** Section 2 splash — Location & Work */
export default function SplashLocationScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-location'),
    [],
  );

  return (
    <SplashScreen
      illustration={<LocationWorldIllustration width={layout.illustrationWidth} />}
      heading={t('onboarding.s2.heading')}
      description={t('onboarding.s2.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/location')}
      onBack={handleBack}
      chapter={t('onboarding.location.chapter')}
    />
  );
}
