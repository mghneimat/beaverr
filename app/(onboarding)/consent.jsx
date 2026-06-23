import { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import {
  navigateBack,
  navigateForward,
  ONBOARDING_ENTRY_HISTORY,
  resetNavHistory,
  useOnboardingScreen,
} from '../../lib/onboardingNavigation';
import { getData } from '../../lib/storage';
import { isConsentAccepted, saveConsent } from '../../lib/consent';
import { isDashboardUnlocked } from '../../lib/onboardingProgress';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { C, T, S, R, INPUT_FIELD } from '../../constants/onboarding-theme';
import FadeUpView from '../../components/onboarding/FadeUpView';
import OnboardingIntroCardLayout from '../../components/onboarding/OnboardingIntroCardLayout';
import OnboardingBottomBar from '../../components/onboarding/OnboardingBottomBar';
import OnboardingNavBackButton from '../../components/onboarding/OnboardingNavBackButton';
import OnboardingPressable from '../../components/onboarding/OnboardingPressable';
import ConsentGdprIllustration from '../../components/onboarding/ConsentGdprIllustration';

export default function ConsentScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  useOnboardingScreen();
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    (async () => {
      if (await isConsentAccepted()) {
        const onboarding = await getData('beaverr_onboarding');
        if (isDashboardUnlocked(onboarding)) {
          router.replace('/(app)/dashboard');
        } else if (onboarding?.setupMode === 'quick' && onboarding?.currentStep === 'quick-setup') {
          router.replace('/(onboarding)/quick-setup');
        } else if (onboarding?.setupMode) {
          router.replace(onboarding.resumeRoute || '/(onboarding)/household');
        } else {
          router.replace('/(onboarding)/setup-mode');
        }
      }
    })();
  }, []);

  const handleContinue = async () => {
    if (agreed) {
      await saveConsent();
      await resetNavHistory([
        ...ONBOARDING_ENTRY_HISTORY,
        { route: '/(onboarding)/setup-mode' },
      ]);
      navigateForward('/(onboarding)/setup-mode');
    }
  };

  const handleBack = () => {
    navigateBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{
        backgroundColor: C.surface,
        height: S.navHeight,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        <OnboardingNavBackButton onPress={handleBack} cooldown={false} />
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
            {t('onboarding.consent.title')}
          </Text>
        </View>
        <View style={{ width: 100 }} />
      </View>

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
          <FadeUpView>
            <OnboardingIntroCardLayout
              illustration={<ConsentGdprIllustration width={layout.illustrationWidth} />}
              title={t('onboarding.consent.title')}
              titleTextStyle={{
                ...T.questionTitle,
                textAlign: 'left',
                marginTop: 0,
              }}
              description={t('onboarding.consent.body')}
              descriptionTextStyle={{
                ...T.helper,
                textAlign: 'left',
                marginBottom: 0,
              }}
              footer={(
                <OnboardingBottomBar
                  inCard
                  layout={layout}
                  primaryLabel={t('common.continue')}
                  onPrimary={handleContinue}
                  primaryDisabled={!agreed}
                  showExit={false}
                />
              )}
            >
              <OnboardingPressable
                onPress={() => setAgreed(!agreed)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed }}
                accessibilityLabel={t('onboarding.consent.checkbox')}
                style={({ pressed, hovered }) => ({
                  borderRadius: R.input,
                  borderWidth: 1.5,
                  borderColor: agreed ? C.accent : C.border,
                  backgroundColor: agreed
                    ? C.infoBg
                    : pressed
                      ? C.overlayPressed
                      : hovered
                        ? C.bg
                        : C.surface,
                  paddingHorizontal: INPUT_FIELD.paddingHorizontal,
                  paddingVertical: INPUT_FIELD.paddingVertical,
                  minHeight: INPUT_FIELD.minHeight,
                })}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'nowrap',
                  width: '100%',
                }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    marginRight: 12,
                    flexShrink: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: agreed ? C.pillSelectedBg : 'transparent',
                    borderColor: agreed ? C.pillSelectedBg : C.border,
                  }}>
                    {agreed ? (
                      <Text style={{ color: C.pillSelectedText, fontSize: 14, lineHeight: 16 }}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={{
                    fontSize: 15,
                    lineHeight: 22,
                    flex: 1,
                    flexShrink: 1,
                    color: agreed ? C.accent : C.text,
                  }}>
                    {t('onboarding.consent.checkbox')}
                  </Text>
                </View>
              </OnboardingPressable>
            </OnboardingIntroCardLayout>
          </FadeUpView>
        </View>
      </ScrollView>
    </View>
  );
}
