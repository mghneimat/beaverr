import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import { ensureDefaultLocation } from '../../lib/onboarding/ensureDefaultLocation';
import SplashScreen from '../../components/onboarding/SplashScreen';
import CitizenshipIdCardIllustration from '../../components/onboarding/CitizenshipIdCardIllustration';

/** Section 2 splash — Residence & Work (citizenship, permits, occupation) */
export default function SplashResidenceScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-residence'),
    [],
  );

  const handleContinue = useCallback(async () => {
    await ensureDefaultLocation();
    navigateForward('/(onboarding)/citizenship');
  }, []);

  return (
    <SplashScreen
      illustration={<CitizenshipIdCardIllustration width={layout.illustrationWidth} />}
      heading={t('onboarding.splashResidence.heading')}
      description={t('onboarding.splashResidence.body')}
      cta={t('common.continue')}
      onContinue={handleContinue}
      onBack={handleBack}
      chapter={t('onboarding.splashResidence.chapter')}
    />
  );
}
