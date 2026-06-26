import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FadeUpView from '../../components/onboarding/FadeUpView';
import OnboardingScreenShell from '../../components/onboarding/OnboardingScreenShell';
import OnboardingBottomBar from '../../components/onboarding/OnboardingBottomBar';
import OnboardingIntroCardLayout from '../../components/onboarding/OnboardingIntroCardLayout';
import TimeManagementRafikiIllustration from '../../components/onboarding/TimeManagementRafikiIllustration';
import { C, S, T } from '../../constants/onboarding-theme';
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
  getValidSavedResumeRoute,
  isDashboardUnlocked,
  isQuestionnaireComplete,
} from '../../lib/onboardingProgress';

export default function WelcomeScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const isFullBleed = layout.surfaceVariant === 'fullBleed';
  useOnboardingScreen();

  const handleGetStarted = async () => {
    const onboarding = await getOnboardingState();

    if (isDashboardUnlocked(onboarding) && !isQuestionnaireComplete(onboarding)) {
      const saved = getValidSavedResumeRoute(onboarding);
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

  const introCard = (
    <OnboardingIntroCardLayout
      variant={isFullBleed ? 'fullBleed' : 'card'}
      layoutMode={isFullBleed ? 'introScroll' : 'form'}
      contentPadH={layout.contentPadH}
      illustration={<TimeManagementRafikiIllustration width={layout.illustrationWidth} />}
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
          fullBleedFooter={isFullBleed}
          layout={layout}
          primaryLabel={t('onboarding.welcome.cta')}
          onPrimary={handleGetStarted}
          showExit={false}
        />
      )}
    />
  );

  return (
    <OnboardingScreenShell>
    <View style={{
      flex: 1,
      backgroundColor: isFullBleed ? C.surface : C.bg,
      paddingTop: isFullBleed ? insets.top : 0,
    }}
    >
      {isFullBleed ? (
        <View style={{ flex: 1, minHeight: 0, width: '100%' }}>
          <FadeUpView skipInitial style={{ flex: 1, width: '100%', minHeight: 0 }}>
            {introCard}
          </FadeUpView>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
          }}
        >
          <View style={{
            paddingHorizontal: S.pagePadH,
            paddingTop: Math.max(insets.top, 32) + 16,
            paddingBottom: 48,
            maxWidth: S.maxWidth,
            width: '100%',
          }}
          >
            <FadeUpView skipInitial style={{ alignItems: 'stretch', width: '100%', maxWidth: S.maxWidth }}>
              {introCard}
            </FadeUpView>
          </View>
        </ScrollView>
      )}
    </View>
    </OnboardingScreenShell>
  );
}
