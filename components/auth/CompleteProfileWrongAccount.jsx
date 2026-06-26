import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import TextLinkButton from '../ui/TextLinkButton';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useI18n } from '../../lib/i18n';
import { useAuth } from '../../lib/auth/AuthProvider';
import { deleteAccountAndData } from '../../lib/account/deleteAccountAndData';
import { mapDeleteAccountErrorKey } from '../../lib/auth/deleteAccount';
import { mapOAuthErrorKey } from '../../lib/auth/mapAuthError';
import { routeAfterAuth } from '../../lib/auth/routeAfterAuth';
import { getUserOAuthProvider } from '../../lib/auth/getUserOAuthProvider';
import { C, T } from '../../constants/onboarding-theme';

/** @typedef {import('../../lib/auth/oauth.js').OAuthProvider} OAuthProvider */

/** @type {Record<OAuthProvider, string>} */
const SWITCH_LABEL_KEY = {
  google: 'auth.completeProfile.switchGoogleLink',
  facebook: 'auth.completeProfile.switchOAuthLink',
  apple: 'auth.completeProfile.switchOAuthLink',
};

/** @type {Record<OAuthProvider, string>} */
const SWITCH_A11Y_KEY = {
  google: 'auth.completeProfile.switchGoogleA11y',
  facebook: 'auth.completeProfile.switchOAuthA11y',
  apple: 'auth.completeProfile.switchOAuthA11y',
};

export default function CompleteProfileWrongAccount({
  user,
  onError,
  disabled = false,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { signInWithOAuth, pullCloudHousehold } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const oauthProvider = getUserOAuthProvider(user);

  const handleSwitchOAuth = async () => {
    if (!oauthProvider || busy || disabled) return;
    onError?.('');
    setBusy(true);
    try {
      const deleted = await deleteAccountAndData();
      if (!deleted.ok) {
        onError?.(mapDeleteAccountErrorKey(deleted.code, deleted.error, t));
        return;
      }

      const result = await signInWithOAuth(oauthProvider);
      if (result.pendingRedirect) {
        return;
      }
      if (!result.ok) {
        const key = mapOAuthErrorKey(result.error);
        onError?.(t(`auth.errors.${key}`));
        router.replace('/(auth)/welcome');
        return;
      }

      const userId = result.session?.user?.id;
      if (userId) {
        await routeAfterAuth(router, pullCloudHousehold, userId);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false);
    onError?.('');
    setBusy(true);
    try {
      const result = await deleteAccountAndData();
      if (!result.ok) {
        onError?.(mapDeleteAccountErrorKey(result.code, result.error, t));
        return;
      }
      router.replace('/(auth)/welcome');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <View style={{
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        width: '100%',
      }}
      >
        <Text style={{ ...T.helper, fontSize: 14, color: C.muted, textAlign: 'center' }}>
          {t('auth.completeProfile.switchPrompt')}
        </Text>

        {oauthProvider ? (
          <TextLinkButton
            centered
            label={t(SWITCH_LABEL_KEY[oauthProvider])}
            onPress={handleSwitchOAuth}
            disabled={disabled || busy}
            accessibilityLabel={t(SWITCH_A11Y_KEY[oauthProvider])}
          />
        ) : null}

        <TextLinkButton
          centered
          destructive
          label={t('auth.completeProfile.deleteIncompleteLink')}
          onPress={() => setDeleteDialogOpen(true)}
          disabled={disabled || busy}
          accessibilityLabel={t('auth.completeProfile.deleteIncompleteA11y')}
        />
      </View>

      <ConfirmDialog
        visible={deleteDialogOpen}
        title={t('auth.completeProfile.deleteIncompleteConfirmTitle')}
        message={t('auth.completeProfile.deleteIncompleteConfirmMessage')}
        confirmLabel={t('auth.completeProfile.deleteIncompleteConfirmButton')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </>
  );
}
