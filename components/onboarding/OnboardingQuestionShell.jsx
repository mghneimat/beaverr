import { Platform, View } from 'react-native';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { C, ONBOARDING_ILLUSTRATION } from '../../constants/onboarding-theme';
import OnboardingScreenShell from './OnboardingScreenShell';
import FadeUpView from './FadeUpView';
/**
 * Shared full-bleed question shell — same flex tree as SplashScreen (known good on mobile web).
 */
export default function OnboardingQuestionShell({
  navBar,
  progressBar,
  shellRef,
  animationKey,
  children,
}) {
  const layout = useOnboardingLayout();
  const isFullBleed = layout.surfaceVariant === 'fullBleed';

  return (
    <OnboardingScreenShell>
      <View style={{ flex: 1, backgroundColor: isFullBleed ? C.surface : C.bg }}>
        <View ref={shellRef} style={{ flex: 1, minHeight: 0 }}>
          {navBar}
          {progressBar}
          <View style={{ flex: 1, minHeight: 0, width: '100%' }}>
            {Platform.OS === 'web' ? (
              <View style={{ flex: 1, width: '100%', minHeight: 0 }}>
                {children}
              </View>
            ) : (
            <FadeUpView
              animationKey={animationKey}
              duration={ONBOARDING_ILLUSTRATION.fadeDuration}
              translateY={ONBOARDING_ILLUSTRATION.fadeTranslateY}
              skipInitial
              style={{ flex: 1, width: '100%', minHeight: 0 }}
            >
              {children}
            </FadeUpView>
            )}
          </View>
        </View>
      </View>
    </OnboardingScreenShell>
  );
}
