import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import FadeUpView from '../../components/onboarding/FadeUpView';
import OnboardingScreenShell from '../../components/onboarding/OnboardingScreenShell';
import OnboardingBottomBar from '../../components/onboarding/OnboardingBottomBar';
import OnboardingIntroCardLayout from '../../components/onboarding/OnboardingIntroCardLayout';
import WelcomeAvatarIllustration from '../../components/onboarding/WelcomeAvatarIllustration';
import { C, S, T } from '../../constants/onboarding-theme';
import { isConsentAccepted } from '../../lib/consent';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import {
  navigateForward,
  ONBOARDING_ENTRY_HISTORY,
  resetNavHistory,
  restoreNavHistoryForResume,
  useOnboardingScreen,
} from '../../lib/onboardingNavigation';
import {
  getOnboardingState,
  getSavedResumeRoute,
  isDashboardUnlocked,
  isQuestionnaireComplete,
} from '../../lib/onboardingProgress';

export default function WelcomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  useOnboardingScreen();

  const handleGetStarted = async () => {
    const onboarding = await getOnboardingState();

    if (!(await isConsentAccepted())) {
      await resetNavHistory([{ route: '/(onboarding)/welcome' }]);
      router.push('/(onboarding)/consent');
      return;
    }

    if (isDashboardUnlocked(onboarding) && !isQuestionnaireComplete(onboarding)) {
      const saved = getSavedResumeRoute(onboarding);
      if (saved) {
        await restoreNavHistoryForResume(onboarding);
        navigateForward(saved);
        return;
      }
    }

    await resetNavHistory([
      ...ONBOARDING_ENTRY_HISTORY,
    ]);
    navigateForward('/(onboarding)/setup-mode');
  };

  return (
    <OnboardingScreenShell>
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{
          paddingHorizontal: S.pagePadH,
          paddingVertical: 48,
          maxWidth: S.maxWidth,
          marginHorizontal: 'auto',
          width: '100%',
          flex: 1,
          justifyContent: 'center',
        }}>
          <FadeUpView skipInitial style={{ alignItems: 'stretch', width: '100%', maxWidth: S.maxWidth }}>
            <OnboardingIntroCardLayout
              illustration={<WelcomeAvatarIllustration size={layout.illustrationWidth} />}
              title={t('onboarding.welcome.heading')}
              titleTextStyle={{
                ...T.questionTitle,
                textAlign: 'left',
                marginTop: 0,
              }}
              description={t('onboarding.welcome.description')}
              descriptionTextStyle={{
                ...T.welcomeBody,
                textAlign: 'left',
                marginBottom: 0,
              }}
              footer={(
                <OnboardingBottomBar
                  inCard
                  layout={layout}
                  primaryLabel={t('onboarding.welcome.cta')}
                  onPrimary={handleGetStarted}
                  showExit={false}
                />
              )}
            />
          </FadeUpView>
        </View>
      </ScrollView>
    </View>
    </OnboardingScreenShell>
  );
}
