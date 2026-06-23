import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward, recordVisit } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import { patchOnboardingState } from '../../lib/onboardingProgress';
import {
  buildHouseholdResumeRoute,
  getHouseholdResumeStep,
  householdNavParams,
} from '../../lib/householdOnboardingSave';
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

  const handleContinue = useCallback(async () => {
    const { step, childIndex } = await getHouseholdResumeStep();
    const target = buildHouseholdResumeRoute(step, childIndex);
    await patchOnboardingState({
      currentStep: 'household',
      resumeRoute: target,
    });
    recordVisit('/(onboarding)/household', householdNavParams(step, childIndex));
    navigateForward(target);
  }, []);

  return (
    <SplashScreen
      illustration={<HouseholdFamilyIllustration width={layout.illustrationWidth} />}
      heading={t('onboarding.splashHousehold.heading')}
      description={t('onboarding.splashHousehold.body')}
      cta={t('common.continue')}
      onContinue={handleContinue}
      onBack={handleBack}
      chapter={t('onboarding.splashHousehold.chapter')}
    />
  );
}
