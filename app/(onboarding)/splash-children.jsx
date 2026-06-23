import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import ChildrenPreparingBackpackBroIllustration from '../../components/onboarding/ChildrenPreparingBackpackBroIllustration';

/** Section 7 splash — Children's Expenses */
export default function SplashChildrenScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-children'),
    [],
  );

  return (
    <SplashScreen
      illustration={<ChildrenPreparingBackpackBroIllustration width={layout.illustrationWidth} />}
      animationKey="splash-children"
      heading={t('onboarding.s7.heading')}
      description={t('onboarding.s7.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/children-costs')}
      onBack={handleBack}
      chapter={t('onboarding.childrenCosts.chapter')}
    />
  );
}
