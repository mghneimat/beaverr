import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import GoodDoggyCuateIllustration from '../../components/onboarding/GoodDoggyCuateIllustration';

/** Section 8 splash — Pets */
export default function SplashPetsScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-pets'),
    [],
  );

  return (
    <SplashScreen
      illustration={<GoodDoggyCuateIllustration width={layout.illustrationWidth} />}
      animationKey="splash-pets"
      heading={t('onboarding.s8.heading')}
      description={t('onboarding.s8.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/pets')}
      onBack={handleBack}
      chapter={t('onboarding.pets.chapter')}
    />
  );
}
