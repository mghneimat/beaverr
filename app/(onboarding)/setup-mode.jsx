import { Text } from '@gluestack-ui/themed';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import FadeUpView from '../../components/onboarding/FadeUpView';
import OnboardingScreenShell from '../../components/onboarding/OnboardingScreenShell';
import OnboardingBottomBar from '../../components/onboarding/OnboardingBottomBar';
import OnboardingIntroCardLayout from '../../components/onboarding/OnboardingIntroCardLayout';
import OnboardingNavBackButton from '../../components/onboarding/OnboardingNavBackButton';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import SetupModeIllustration from '../../components/onboarding/SetupModeIllustration';
import { choiceCardBg, choiceCardBorder } from '../../components/onboarding/pressableFeedback';
import { C, R, S, T } from '../../constants/onboarding-theme';
import { useI18n } from '../../lib/i18n';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { patchOnboardingState } from '../../lib/onboardingProgress';
import { navigateBack, navigateForward, ONBOARDING_ENTRY_HISTORY, resetNavHistory, useOnboardingScreen } from '../../lib/onboardingNavigation';
/**
 * Post-consent setup path choice — full questionnaire (recommended) or quick setup.
 */
export default function SetupModeScreen() {
  const { t } = useI18n();
  const layout = useOnboardingLayout();
  useOnboardingScreen();
  const [mode, setMode] = useState('full');

  const handleContinue = async () => {
    if (mode === 'full') {
      await resetNavHistory([
        ...ONBOARDING_ENTRY_HISTORY,
        { route: '/(onboarding)/setup-mode' },
      ]);
      await patchOnboardingState({
        completed: false,
        dashboardUnlocked: false,
        questionnaireComplete: false,
        setupMode: 'full',
        currentStep: 'household',
        percentComplete: 4,
        resumeRoute: '/(onboarding)/splash-household',
      });
      navigateForward('/(onboarding)/splash-household');
      return;
    }

    await resetNavHistory([
      ...ONBOARDING_ENTRY_HISTORY,
      { route: '/(onboarding)/setup-mode' },
    ]);
    await patchOnboardingState({
      completed: false,
      dashboardUnlocked: false,
      questionnaireComplete: false,
      setupMode: 'quick',
      currentStep: 'quick-setup',
      percentComplete: 0,
      resumeRoute: '/(onboarding)/quick-setup',
    });
    navigateForward('/(onboarding)/quick-setup');
  };

  return (
    <OnboardingScreenShell>
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{
        backgroundColor: C.surface,
        height: S.navHeight,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        <OnboardingNavBackButton onPress={() => navigateBack()} cooldown={false} />
        <View style={{
          position: 'absolute',
          left: 0,
          right: 0,
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              ...T.chapterLabel,
              maxWidth: layout.width - 160,
            }}
          >
            {t('onboarding.setupMode.chapter')}
          </Text>
        </View>
        <View style={{ width: 100 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{
          paddingHorizontal: S.pagePadH,
          paddingVertical: 40,
          maxWidth: S.maxWidth,
          marginHorizontal: 'auto',
          width: '100%',
        }}>
          <FadeUpView skipInitial>
            <OnboardingIntroCardLayout
              illustration={<SetupModeIllustration width={layout.illustrationWidth} />}
              title={t('onboarding.setupMode.title')}
              titleTextStyle={{
                ...T.questionTitle,
                textAlign: 'left',
                marginTop: 0,
              }}
              description={t('onboarding.setupMode.body')}
              descriptionTextStyle={{
                ...T.helper,
                textAlign: 'left',
                marginBottom: 0,
              }}
              footer={(
                <OnboardingBottomBar
                  inCard
                  layout={layout}
                  primaryLabel={t('onboarding.setupMode.cta')}
                  onPrimary={handleContinue}
                  showExit
                  resumeRoute="/(onboarding)/setup-mode"
                />
              )}
            >
            <OnboardingPressable
              onPress={() => setMode('full')}
              accessibilityRole="radio"
              accessibilityState={{ selected: mode === 'full' }}
              style={({ pressed, hovered }) => ({
                padding: 18,
                borderRadius: R.card,
                borderWidth: 2,
                borderColor: choiceCardBorder({ hovered, selected: mode === 'full', selectedBorder: C.accent }),
                backgroundColor: choiceCardBg({ pressed, hovered, selected: mode === 'full', selectedBg: C.infoBg }),
                marginBottom: 12,
              })}
            >
              <View>{[
                <View key="header" style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: mode === 'full' ? C.accent : C.text, flex: 1 }}>
                    {t('onboarding.setupMode.full.title')}
                  </Text>
                  <View style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: R.pill,
                    backgroundColor: C.accent,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: C.pillSelectedText }}>
                      {t('onboarding.setupMode.recommended')}
                    </Text>
                  </View>
                </View>,
                <Text key="helper" style={{ ...T.helper, fontSize: 14 }}>
                  {t('onboarding.setupMode.full.helper')}
                </Text>,
                <Text key="duration" style={{
                  fontSize: 13,
                  lineHeight: 18,
                  fontWeight: '600',
                  marginTop: 10,
                  color: C.muted,
                }}>
                  {t('onboarding.setupMode.full.duration')}
                </Text>,
              ]}</View>
            </OnboardingPressable>

            <OnboardingPressable
              onPress={() => setMode('quick')}
              accessibilityRole="radio"
              accessibilityState={{ selected: mode === 'quick' }}
              style={({ pressed, hovered }) => ({
                padding: 18,
                borderRadius: R.card,
                borderWidth: 2,
                borderColor: choiceCardBorder({ hovered, selected: mode === 'quick', selectedBorder: C.accent }),
                backgroundColor: choiceCardBg({ pressed, hovered, selected: mode === 'quick', selectedBg: C.infoBg }),
                marginBottom: 12,
              })}
            >
              <View>{[
                <Text key="title" style={{ fontSize: 16, fontWeight: '600', color: mode === 'quick' ? C.accent : C.text, marginBottom: 6 }}>
                  {t('onboarding.setupMode.quick.title')}
                </Text>,
                <Text key="helper" style={{ ...T.helper, fontSize: 14 }}>
                  {t('onboarding.setupMode.quick.helper')}
                </Text>,
                <Text key="duration" style={{
                  fontSize: 13,
                  lineHeight: 18,
                  fontWeight: '600',
                  marginTop: 10,
                  color: C.muted,
                }}>
                  {t('onboarding.setupMode.quick.duration')}
                </Text>,
              ]}</View>
            </OnboardingPressable>
            </OnboardingIntroCardLayout>
          </FadeUpView>
        </View>
      </ScrollView>
    </View>
    </OnboardingScreenShell>
  );
}
