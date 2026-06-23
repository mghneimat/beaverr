import React, { useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { navigateForward } from '../../lib/onboardingNavigation';
import { navigateBackFromSectionSplash } from '../../lib/onboardingResume';
import SplashScreen from '../../components/onboarding/SplashScreen';
import MoneyStressAmicoIllustration from '../../components/onboarding/MoneyStressAmicoIllustration';

/** Section 11 splash — Debts & Loans */
export default function SplashDebtsScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();

  const handleBack = useCallback(
    () => navigateBackFromSectionSplash('/(onboarding)/splash-debts'),
    [],
  );

  return (
    <SplashScreen
      illustration={<MoneyStressAmicoIllustration width={layout.illustrationWidth} />}
      animationKey="splash-debts"
      heading={t('onboarding.s11.heading')}
      description={t('onboarding.s11.body')}
      cta={t('common.continue')}
      onContinue={() => navigateForward('/(onboarding)/debts')}
      onBack={handleBack}
      chapter={t('onboarding.debts.chapter')}
    />
  );
}
