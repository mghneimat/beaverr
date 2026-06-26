import { useState, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingScreenShell from '../../components/onboarding/OnboardingScreenShell';
import OnboardingIntroCardLayout from '../../components/onboarding/OnboardingIntroCardLayout';
import WelcomeAvatarIllustration from '../../components/onboarding/WelcomeAvatarIllustration';
import AuthSocialButtons from '../../components/auth/AuthSocialButtons';
import PrimaryButton from '../../components/ui/PrimaryButton';
import FieldError from '../../components/onboarding/FieldError';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthProvider';
import { routeAfterAuth } from '../../lib/auth/routeAfterAuth';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { C, S, T } from '../../constants/onboarding-theme';

export default function AuthWelcomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { session, loading, pullCloudHousehold } = useAuth();
  const layout = useOnboardingLayout();
  const insets = useSafeAreaInsets();
  const isFullBleed = layout.surfaceVariant === 'fullBleed';
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading || !session?.user?.id) return;
    routeAfterAuth(router, pullCloudHousehold, session.user.id);
  }, [loading, session, router, pullCloudHousehold]);

  const footer = (
    <View style={{ gap: 12, width: '100%' }}>
      <AuthSocialButtons onError={setError} />
      {error ? <FieldError message={error} /> : null}
      <PrimaryButton onPress={() => router.push('/(auth)/signup')}>
        {t('auth.welcome.continueWithEmail')}
      </PrimaryButton>
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
      }}
      >
        <Text style={{ ...T.helper, fontSize: 14, color: C.muted }}>
          {t('auth.welcome.switchPrompt')}
          {' '}
        </Text>
        <Pressable
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="link"
          accessibilityLabel={t('auth.welcome.goToLogin')}
          hitSlop={8}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: C.accent,
            textDecorationLine: 'underline',
          }}
          >
            {t('auth.welcome.switchLink')}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const introCard = (
    <OnboardingIntroCardLayout
      variant={isFullBleed ? 'fullBleed' : 'card'}
      layoutMode={isFullBleed ? 'introScroll' : 'form'}
      contentPadH={layout.contentPadH}
      illustration={<WelcomeAvatarIllustration size={layout.illustrationWidth} />}
      title={t('auth.welcome.title')}
      titleTextStyle={{ ...T.questionTitle, textAlign: 'left', marginTop: 0 }}
      description={t('auth.welcome.body')}
      descriptionTextStyle={{ ...T.welcomeBody, textAlign: 'left', marginBottom: 0 }}
      footer={footer}
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
            {introCard}
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              alignItems: 'center',
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{
              paddingHorizontal: layout.pagePadH,
              paddingTop: Math.max(insets.top, 32) + 16,
              paddingBottom: 48,
              maxWidth: S.maxWidth,
              width: '100%',
            }}
            >
              <View style={{ alignItems: 'stretch', width: '100%', maxWidth: S.maxWidth }}>
                {introCard}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </OnboardingScreenShell>
  );
}
