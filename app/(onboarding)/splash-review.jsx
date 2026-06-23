import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import ConfirmedAmicoIllustration from '../../components/onboarding/ConfirmedAmicoIllustration';

/** Section 13 splash — Review & Confirm */
export default function SplashReviewScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-review'),
    [],
  );

  return (
    <SplashScreen
      illustration={<ConfirmedAmicoIllustration width={layout.illustrationWidth} />}
      animationKey="splash-review"
      heading={t('onboarding.s13.heading')}
      description={t('onboarding.s13.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/review')}
      onBack={handleBack}
      chapter={t('onboarding.review.chapter')}
    />
  );
}
