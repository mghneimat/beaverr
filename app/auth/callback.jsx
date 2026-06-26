import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import AppLoadingScreen from '../../components/app/AppLoadingScreen';
import { handleOAuthCallbackUrl } from '../../lib/auth/oauthCallback';
import { routeAfterAuth } from '../../lib/auth/routeAfterAuth';
import { mapOAuthErrorKey } from '../../lib/auth/mapAuthError';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useI18n } from '../../lib/i18n';
import { C, S, T } from '../../constants/onboarding-theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { pullCloudHousehold } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function finish() {
      const href = typeof window !== 'undefined' ? window.location.href : '';
      if (!href) {
        if (active) router.replace('/(auth)/welcome');
        return;
      }

      const result = await handleOAuthCallbackUrl(href);
      if (!active) return;

      if (!result.ok) {
        console.warn('OAuth callback failed:', result.error);
        const key = mapOAuthErrorKey(result.error);
        setError(t(`auth.errors.${key}`));
        return;
      }

      const userId = result.session?.user?.id;
      if (userId) {
        await routeAfterAuth(router, pullCloudHousehold, userId);
        return;
      }

      router.replace('/(auth)/welcome');
    }

    finish();

    return () => {
      active = false;
    };
  }, [router, pullCloudHousehold, t]);

  if (error) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: C.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: S.pagePadH,
      }}
      >
        <Text style={{ ...T.helper, color: C.danger, textAlign: 'center', marginBottom: 16 }}>
          {error}
        </Text>
        <Text
          accessibilityRole="link"
          onPress={() => router.replace('/(auth)/welcome')}
          style={{ ...T.helper, color: C.accent, textDecorationLine: 'underline' }}
        >
          {t('common.back')}
        </Text>
      </View>
    );
  }

  return <AppLoadingScreen label={t('common.loading')} />;
}
