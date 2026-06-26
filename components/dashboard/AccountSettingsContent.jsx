import { useState } from 'react';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleConfirmDeleteAccount = async () => {
    setDeleteDialogOpen(false);
    setDeleteError('');
    clearScheduledCloudPush();
    const result = await deleteAccountAndData();
    if (!result.ok) {
      setDeleteError(mapDeleteAccountErrorKey(result.code, result.error, t));
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
              {t('dashboard.accountSettingsScreen.deleteAccountHelper')}
            </Text>
            {deleteError ? (
              <Text style={{ ...T.helper, color: C.danger, marginBottom: 8 }}>
                {deleteError}
              </Text>
            ) : null}
            <CardActionRow
              label={t('settings.deleteAccount')}
              onPress={() => setDeleteDialogOpen(true)}
              destructive
            />
          </SurfaceCard>
        ) : null}
      </TabSectionStack>

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
