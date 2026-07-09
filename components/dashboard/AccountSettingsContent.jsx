import { useState } from 'react';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { clearSavedData } from '../../lib/account/clearSavedData';
import { deleteAccountAndData } from '../../lib/account/deleteAccountAndData';
import { mapDeleteAccountErrorKey } from '../../lib/auth/deleteAccount';
import { useAuth } from '../../lib/auth/AuthProvider';
import { clearScheduledCloudPush } from '../../lib/cloud/syncHousehold';
import { C, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import ConfirmDialog from '../ui/ConfirmDialog';
import TabSectionStack from './TabSectionStack';
import CardActionRow from './CardActionRow';
import AccountPreferencesForm from './AccountPreferencesForm';

export default function AccountSettingsContent() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, configured } = useAuth();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleConfirmClearSavedData = async () => {
    setClearDialogOpen(false);
    setActionError('');
    if (!user?.id) return;

    const result = await clearSavedData(user.id);
    if (!result.ok) {
      setActionError(t('dashboard.accountSettingsScreen.clearSavedDataFailed'));
      return;
    }
    router.replace('/(onboarding)/welcome');
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteDialogOpen(false);
    setActionError('');
    clearScheduledCloudPush();
    const result = await deleteAccountAndData();
    if (!result.ok) {
      setActionError(mapDeleteAccountErrorKey(result.code, result.error, t));
      return;
    }
    router.replace('/(auth)/welcome');
  };

  return (
    <>
      <TabSectionStack>
        <SurfaceCard>
          <InCardSectionHeader title={t('auth.signup.sectionPreferences')} />
          <AccountPreferencesForm />
        </SurfaceCard>

        {configured && user ? (
          <SurfaceCard>
            <InCardSectionHeader title={t('dashboard.accountSettingsScreen.privacyTitle')} />
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 8 }}>
              {t('dashboard.accountSettingsScreen.privacyHelper')}
            </Text>
            {actionError ? (
              <Text style={{ ...T.helper, color: C.danger, marginBottom: 8 }}>
                {actionError}
              </Text>
            ) : null}
            <CardActionRow
              label={t('dashboard.accountSettingsScreen.clearSavedData')}
              onPress={() => setClearDialogOpen(true)}
            />
            <CardActionRow
              label={t('settings.deleteAccount')}
              onPress={() => setDeleteDialogOpen(true)}
              destructive
            />
          </SurfaceCard>
        ) : null}
      </TabSectionStack>

      <ConfirmDialog
        visible={clearDialogOpen}
        title={t('dashboard.accountSettingsScreen.clearSavedDataConfirmTitle')}
        message={t('dashboard.accountSettingsScreen.clearSavedDataConfirmMessage')}
        confirmLabel={t('dashboard.accountSettingsScreen.clearSavedDataConfirmButton')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmClearSavedData}
        onCancel={() => setClearDialogOpen(false)}
      />

      <ConfirmDialog
        visible={deleteDialogOpen}
        title={t('settings.deleteAccountConfirmTitle')}
        message={t('settings.deleteAccountConfirmMessage')}
        confirmLabel={t('settings.deleteAccountConfirmButton')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </>
  );
}
