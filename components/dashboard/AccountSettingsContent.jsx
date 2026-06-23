import { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { isConsentAccepted, revokeConsent } from '../../lib/consent';
import { C, R, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import ConfirmDialog from '../ui/ConfirmDialog';
import TabSectionStack from './TabSectionStack';

function SettingsActionRow({ label, onPress, destructive = false }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48,
        paddingHorizontal: 4,
        paddingVertical: 10,
        borderRadius: R.pill,
        backgroundColor: pressed || hovered ? C.overlayHover : 'transparent',
      })}
    >
      <Text style={{
        fontSize: 15,
        fontWeight: '600',
        color: destructive ? C.danger : C.text,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function AccountSettingsContent() {
  const { t } = useI18n();
  const router = useRouter();
  const [showRevokeConsent, setShowRevokeConsent] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  useEffect(() => {
    isConsentAccepted().then(setShowRevokeConsent);
  }, []);

  const handleConfirmRevoke = async () => {
    setRevokeDialogOpen(false);
    await revokeConsent();
    setShowRevokeConsent(false);
    router.replace('/(onboarding)/consent');
  };

  return (
    <>
      <TabSectionStack>
        <SurfaceCard>
          <InCardSectionHeader title={t('dashboard.accountSettings')} />
          <Text style={{ ...T.helper, color: C.muted }}>
            {t('dashboard.accountSettingsScreen.helper')}
          </Text>
        </SurfaceCard>

        {showRevokeConsent ? (
          <SurfaceCard>
            <InCardSectionHeader title={t('dashboard.accountSettingsScreen.privacyTitle')} />
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 8 }}>
              {t('dashboard.accountSettingsScreen.revokeHelper')}
            </Text>
            <SettingsActionRow
              label={t('settings.revokeConsent')}
              onPress={() => setRevokeDialogOpen(true)}
              destructive
            />
          </SurfaceCard>
        ) : null}
      </TabSectionStack>

      <ConfirmDialog
        visible={revokeDialogOpen}
        title={t('settings.revokeConsentConfirmTitle')}
        message={t('settings.revokeConsentConfirmMessage')}
        confirmLabel={t('settings.revokeConsentConfirmButton')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleConfirmRevoke}
        onCancel={() => setRevokeDialogOpen(false)}
      />
    </>
  );
}
