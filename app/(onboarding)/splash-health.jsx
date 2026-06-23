import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import InsuranceAmicoIllustration from '../../components/onboarding/InsuranceAmicoIllustration';

/** Section 6 splash — Health Insurance */
export default function SplashHealthScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-health'),
    [],
  );

  return (
    <SplashScreen
      illustration={<InsuranceAmicoIllustration width={layout.illustrationWidth} />}
      animationKey="splash-health"
      heading={t('onboarding.s6.heading')}
      description={t('onboarding.s6.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/health')}
      onBack={handleBack}
      chapter={t('onboarding.health.chapter')}
    />
  );
}
