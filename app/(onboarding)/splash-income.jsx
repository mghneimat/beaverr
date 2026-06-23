import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import IncomeWalletIllustration from '../../components/onboarding/IncomeWalletIllustration';

/** Section 3 splash — Income */
export default function SplashIncomeScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-income'),
    [],
  );

  return (
    <SplashScreen
      illustration={<IncomeWalletIllustration width={layout.illustrationWidth} />}
      animationKey="splash-income"
      heading={t('onboarding.s3.heading')}
      description={t('onboarding.s3.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/income')}
      onBack={handleBack}
      chapter={t('onboarding.income.chapter')}
    />
  );
}
