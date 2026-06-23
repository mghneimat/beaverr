import { useState } from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter, useSegments } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { S } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import ConfirmDialog from '../ui/ConfirmDialog';
import {
  cardHeaderActionLabelStyle,
  cardHeaderActionStyle,
} from '../dashboard/CardHeaderActionButton';
import {
  discardOnboardingProgress,
  getDiscardConfirmMessage,
  saveOnboardingForLater,
} from '../../lib/onboardingExit';
import OnboardingPressable from './OnboardingPressable';
import SkipButton from './SkipButton';

const ROW_BTN_MIN_HEIGHT = 48;

/**
 * Onboarding footer — Discard + Continue on one row; Save for later centered below.
 */
export default function OnboardingBottomBar({
  layout,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryAccessibilityState,
  showExit = false,
  resumeRoute: resumeRouteProp,
  exitPatch,
  onSaveDraft,
  exitDisabled = false,
  onSkip,
  skipLabel,
  compact = false,
  inCard = false,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const segments = useSegments();
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discardMessage, setDiscardMessage] = useState('');
  const [discarding, setDiscarding] = useState(false);

  const resumeRoute = resumeRouteProp || `/${segments.join('/')}`;
  const isNarrow = layout?.isNarrow;
  const useShortDiscard = isNarrow || compact;
  const btnPadH = useShortDiscard ? 10 : 28;
  const btnTextSize = useShortDiscard ? 14 : undefined;
  const discardLabel = useShortDiscard
    ? t('onboarding.exit.discardShort')
    : t('onboarding.exit.discard');

  const shell = inCard
    ? {
        width: '100%',
        alignSelf: 'stretch',
      }
    : {
        paddingHorizontal: layout?.pagePadH ?? S.pagePadH,
        maxWidth: S.maxWidth,
        width: '100%',
        alignSelf: 'center',
      };

  const rowButtonStyle = {
    flex: 1,
    minWidth: 0,
    minHeight: ROW_BTN_MIN_HEIGHT,
    paddingVertical: 12,
    paddingHorizontal: btnPadH,
    alignSelf: 'stretch',
  };

  const rowTextStyle = {
    fontSize: btnTextSize,
    textAlign: 'center',
  };

  const handleSaveForLater = async () => {
    if (exitDisabled) return;
    await saveOnboardingForLater({ resumeRoute, patch: exitPatch, onSaveDraft });
    router.replace('/(app)/dashboard');
  };

  const openDiscardDialog = async () => {
    if (exitDisabled || discarding) return;
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
      <View style={[shell, {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 10,
        paddingTop: inCard ? 0 : 8,
        paddingBottom: compact ? 8 : onSkip ? 4 : showExit ? 4 : inCard ? 0 : 8,
      }]}>
        {showExit ? (
          <PrimaryButton
            variant="outline"
            onPress={openDiscardDialog}
            disabled={exitDisabled || discarding}
            fullWidth={false}
            numberOfLines={1}
            style={rowButtonStyle}
            textStyle={rowTextStyle}
            accessibilityLabel={t('onboarding.exit.discard')}
          >
            {discardLabel}
          </PrimaryButton>
        ) : null}

        <PrimaryButton
          onPress={onPrimary}
          disabled={primaryDisabled}
          fullWidth={!showExit}
          numberOfLines={1}
          style={showExit ? rowButtonStyle : { minHeight: ROW_BTN_MIN_HEIGHT, paddingVertical: 12, paddingHorizontal: btnPadH }}
          textStyle={rowTextStyle}
          accessibilityState={primaryAccessibilityState}
        >
          {primaryLabel}
        </PrimaryButton>
      </View>

      {showExit && !compact ? (
        <View style={[shell, { paddingBottom: onSkip ? 4 : inCard ? 0 : 12, alignItems: 'center' }]}>
          <OnboardingPressable
            onPress={handleSaveForLater}
            disabled={exitDisabled}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.exit.saveForLater')}
            style={({ pressed, hovered }) => ({
              ...cardHeaderActionStyle({ pressed, hovered }),
              minWidth: undefined,
              minHeight: 32,
              paddingVertical: 6,
              paddingHorizontal: 12,
              opacity: exitDisabled ? 0.5 : 1,
            })}
          >
            <Text style={cardHeaderActionLabelStyle()} numberOfLines={1}>
              {t('onboarding.exit.saveForLater')}
            </Text>
          </OnboardingPressable>
        </View>
      ) : null}

      {onSkip ? (
        <View style={[shell, { paddingTop: 4, paddingBottom: compact ? 8 : 12 }]}>
          <SkipButton
            label={skipLabel || t('common.skip')}
            onPress={onSkip}
            marginTop={0}
          />
        </View>
      ) : null}

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
