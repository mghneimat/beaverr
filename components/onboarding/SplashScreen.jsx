import { useRef, useEffect } from 'react';
import { View, ScrollView, Animated, Easing } from 'react-native';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { Text } from '@gluestack-ui/themed';
import {
  C,
  T,
  S,
  ONBOARDING_ILLUSTRATION,
  ONBOARDING_SPLASH,
  ONBOARDING_SPLASH_HEADING,
} from '../../constants/onboarding-theme';
import OnboardingBottomBar from './OnboardingBottomBar';
import FadeUpView from './FadeUpView';
import OnboardingIntroCardLayout from './OnboardingIntroCardLayout';
import OnboardingNavBackButton from './OnboardingNavBackButton';
import { useOnboardingScrollToTop } from '../../lib/onboardingScroll';
import { useMonotonicOnboardingProgress } from '../../lib/useOnboardingProgress';
import { navigateBack, useOnboardingScreen } from '../../lib/onboardingNavigation';

/**
 * Full-screen section intro splash screen.
 * Nav bar, progress bar, heading, and in-flow continue CTA.
 */
export default function SplashScreen({
  heading,
  description,
  illustration,
  animationKey,
  cta,
  onContinue,
  chapter,
  onBack,
  progress: progressProp,
  showExitActions = true,
  resumeRoute,
}) {
  const layout = useOnboardingLayout();
  const scrollRef = useRef(null);
  useOnboardingScreen();
  const computedProgress = useMonotonicOnboardingProgress();
  const progress = progressProp ?? computedProgress;

  const fillAnim = useRef(new Animated.Value(progress !== undefined ? progress : 0)).current;
  const hasProgress = progress !== undefined;
  const headingFontSize = layout.isNarrow
    ? ONBOARDING_SPLASH_HEADING.fontSizeNarrow
    : ONBOARDING_SPLASH_HEADING.fontSize;
  const headingLineHeight = layout.isNarrow
    ? ONBOARDING_SPLASH_HEADING.lineHeightNarrow
    : ONBOARDING_SPLASH_HEADING.lineHeight;

  useOnboardingScrollToTop(scrollRef, animationKey ?? chapter ?? 'splash');

  useEffect(() => {
    if (hasProgress) {
      Animated.timing(fillAnim, {
        toValue: Math.min(100, Math.max(0, progress)),
        duration: 400,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false,
      }).start();
    }
  }, [progress, hasProgress]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigateBack();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, minHeight: 0 }}>
        <View style={{
          backgroundColor: C.surface,
          height: S.navHeight,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          flexShrink: 0,
        }}>
          <OnboardingNavBackButton onPress={handleBack} cooldown={false} />

          <View style={{
            position: 'absolute',
            left: 0,
            right: 0,
            alignItems: 'center',
            pointerEvents: 'none',
          }}>
            {chapter ? (
              <Text style={{ ...T.chapterLabel }}>
                {chapter}
              </Text>
            ) : null}
          </View>

          <View style={{ width: 100 }} />
        </View>

        {hasProgress ? (
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
            style={{
              height: S.progressHeight,
              backgroundColor: C.progressTrack,
              flexShrink: 0,
            }}
          >
            <Animated.View style={{
              height: '100%',
              width: fillAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: C.progressFill,
            }} />
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 32, paddingBottom: 24 }}
        >
          <View style={{
            width: '100%',
            maxWidth: S.maxWidth,
            paddingHorizontal: layout.pagePadH,
            alignSelf: 'center',
          }}>
            <FadeUpView
              animationKey={animationKey}
              duration={ONBOARDING_ILLUSTRATION.fadeDuration}
              translateY={ONBOARDING_ILLUSTRATION.fadeTranslateY}
              style={{ width: '100%' }}
            >
              <OnboardingIntroCardLayout
                illustration={illustration}
                illustrationMinHeight={illustration ? layout.illustrationWidth : undefined}
                descriptionMinHeight={
                  illustration
                    ? ONBOARDING_SPLASH.descriptionMinHeight
                    : ONBOARDING_SPLASH.descriptionMinHeightNoIllustration
                }
                title={heading}
                titleTextStyle={{
                  ...T.splashHeading,
                  fontSize: headingFontSize,
                  lineHeight: headingLineHeight,
                  textAlign: 'left',
                  width: '100%',
                  marginTop: 0,
                }}
                description={description}
                descriptionTextStyle={{
                  ...T.helper,
                  textAlign: 'left',
                  marginBottom: 0,
                }}
                footer={(
                  <OnboardingBottomBar
                    inCard
                    layout={layout}
                    primaryLabel={cta}
                    onPrimary={onContinue}
                    showExit={showExitActions}
                    resumeRoute={resumeRoute}
                  />
                )}
              />
            </FadeUpView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
