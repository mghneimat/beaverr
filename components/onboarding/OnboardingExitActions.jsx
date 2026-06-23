import { useState } from 'react';
import { View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import ConfirmDialog from '../ui/ConfirmDialog';
import {
  discardOnboardingProgress,
  getDiscardConfirmMessage,
  saveOnboardingForLater,
} from '../../lib/onboardingExit';
import SkipButton from './SkipButton';

/**
 * Save for later + Discard (legacy standalone block).
 * QuestionScreen now uses OnboardingBottomBar — this module remains for hot-reload compatibility.
 */
export default function OnboardingExitActions({
  resumeRoute: resumeRouteProp,
  patch,
  onSaveDraft,
  disabled = false,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const segments = useSegments();
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discardMessage, setDiscardMessage] = useState('');
  const [discarding, setDiscarding] = useState(false);

  const resumeRoute = resumeRouteProp || `/${segments.join('/')}`;

  const handleSaveForLater = async () => {
    if (disabled) return;
    await saveOnboardingForLater({ resumeRoute, patch, onSaveDraft });
    router.replace('/(app)/dashboard');
  };

  const openDiscardDialog = async () => {
    if (disabled || discarding) return;
    const message = await getDiscardConfirmMessage({
      messageFirstTime: t('onboarding.exit.discardMessageFirstTime'),
      messageReturning: t('onboarding.exit.discardMessageReturning'),
      messageQuickSetup: t('onboarding.exit.discardMessageQuickSetup'),
    });
    setDiscardMessage(message);
    setDiscardOpen(true);
  };

  const handleDiscardConfirm = async () => {
    setDiscarding(true);
    try {
      await discardOnboardingProgress();
      setDiscardOpen(false);
      router.replace('/(app)/dashboard');
    } finally {
      setDiscarding(false);
    }
  };

  return (
    <>
      <View style={{ gap: 10, width: '100%' }}>
        <SkipButton
          label={t('onboarding.exit.saveForLater')}
          onPress={handleSaveForLater}
          marginTop={0}
          disabled={disabled}
        />
        <SkipButton
          label={t('onboarding.exit.discard')}
          onPress={openDiscardDialog}
          marginTop={0}
          disabled={disabled || discarding}
        />
      </View>

      <ConfirmDialog
        visible={discardOpen}
        title={t('onboarding.exit.discardTitle')}
        message={discardMessage}
        confirmLabel={t('onboarding.exit.discardConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleDiscardConfirm}
        onCancel={() => !discarding && setDiscardOpen(false)}
      />
    </>
  );
}
