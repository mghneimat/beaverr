import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import CreditCardRafikiIllustration from '../../components/onboarding/CreditCardRafikiIllustration';

/** Section 9 splash — Subscriptions */
export default function SplashSubscriptionsScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-subscriptions'),
    [],
  );

  return (
    <SplashScreen
      illustration={<CreditCardRafikiIllustration width={layout.illustrationWidth} />}
      animationKey="splash-subscriptions"
      heading={t('onboarding.s9.heading')}
      description={t('onboarding.s9.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/subscriptions')}
      onBack={handleBack}
      chapter={t('onboarding.subscriptions.chapter')}
    />
  );
}
