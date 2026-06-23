import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import BusDriverRafikiIllustration from '../../components/onboarding/BusDriverRafikiIllustration';

/** Section 5 splash — Transport */
export default function SplashTransportScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-transport'),
    [],
  );

  return (
    <SplashScreen
      illustration={<BusDriverRafikiIllustration width={layout.illustrationWidth} />}
      animationKey="splash-transport"
      heading={t('onboarding.s5.heading')}
      description={t('onboarding.s5.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/transport')}
      onBack={handleBack}
      chapter={t('onboarding.transport.chapter')}
    />
  );
}
