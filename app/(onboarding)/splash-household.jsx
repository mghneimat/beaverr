import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import HouseholdFamilyIllustration from '../../components/onboarding/HouseholdFamilyIllustration';

/** Section 1 splash — Household Setup */
export default function SplashHouseholdScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-household'),
    [],
  );

  return (
    <SplashScreen
      illustration={<HouseholdFamilyIllustration width={layout.illustrationWidth} />}
      heading={t('onboarding.splashHousehold.heading')}
      description={t('onboarding.splashHousehold.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/household')}
      onBack={handleBack}
      chapter={t('onboarding.splashHousehold.chapter')}
    />
  );
}
