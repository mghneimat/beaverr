import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import AuthSocialButton from './AuthSocialButton';
import { useAuth } from '../../lib/auth/AuthProvider';
import { routeAfterAuth } from '../../lib/auth/routeAfterAuth';
import { mapOAuthErrorKey } from '../../lib/auth/mapAuthError';
import {
  OAUTH_PROVIDERS,
  isOAuthProviderEnabled,
} from '../../lib/auth/enabledOAuthProviders';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';

/** @typedef {import('../../lib/auth/oauth.js').OAuthProvider} OAuthProvider */

/** @type {Record<OAuthProvider, string>} */
const PROVIDER_I18N_KEY = {
  google: 'auth.social.google',
  facebook: 'auth.social.facebook',
  apple: 'auth.social.apple',
};

/**
 * OAuth sign-in buttons — disabled providers stay visible until enabled in enabledOAuthProviders.js.
 */
export default function AuthSocialButtons({ onError, disabled = false }) {
  const { t } = useI18n();
  const router = useRouter();
  const { signInWithOAuth, pullCloudHousehold, session } = useAuth();
  const [busyProvider, setBusyProvider] = useState(/** @type {OAuthProvider | null} */ (null));

  /** @param {OAuthProvider} provider */
  const handlePress = async (provider) => {
    if (disabled || busyProvider || !isOAuthProviderEnabled(provider)) return;
    setBusyProvider(provider);
    onError?.('');

    try {
      if (session?.user?.id) {
        await routeAfterAuth(router, pullCloudHousehold, session.user.id);
        return;
      }

      const result = await signInWithOAuth(provider);
      if (result.pendingRedirect) {
        if (typeof window !== 'undefined') {
          window.setTimeout(() => setBusyProvider(null), 12000);
        }
        return;
      }
      if (!result.ok) {
        const key = mapOAuthErrorKey(result.error);
        onError?.(t(`auth.errors.${key}`));
        return;
      }

      const userId = result.session?.user?.id;
      if (userId) {
        await routeAfterAuth(router, pullCloudHousehold, userId);
      }
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <View style={{ gap: 10, width: '100%' }}>
      {OAUTH_PROVIDERS.map((provider) => {
        const enabled = isOAuthProviderEnabled(provider);
        const label = t(PROVIDER_I18N_KEY[provider]);
        const buttonDisabled = disabled || busyProvider !== null || !enabled;

        return (
          <AuthSocialButton
            key={provider}
            provider={provider}
            label={label}
            onPress={() => handlePress(provider)}
            disabled={buttonDisabled}
            accessibilityLabel={enabled
              ? label
              : `${label} — ${t('auth.social.comingSoon')}`}
          />
        );
      })}

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
        marginBottom: 4,
      }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        <Text style={{ ...T.hint, color: C.muted }}>{t('auth.social.divider')}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
      </View>
    </View>
  );
}
