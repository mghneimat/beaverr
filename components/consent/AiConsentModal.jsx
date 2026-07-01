import { View, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { saveAiConsent } from '../../lib/advice/aiConsent';
import PrimaryButton from '../ui/PrimaryButton';
import TextLinkButton from '../ui/TextLinkButton';
import { C, R, S, T } from '../../constants/onboarding-theme';

/**
 * One-time AI insight consent — shown on first View tap across dashboard tabs.
 */
export default function AiConsentModal({ visible, onClose, onAccepted }) {
  const { t } = useI18n();

  if (!visible) {
    return null;
  }

  const handleAccept = async () => {
    await saveAiConsent();
    onAccepted?.();
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: S.pagePadH,
        }}
      >
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30,58,95,0.35)',
          }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            maxHeight: '85%',
            backgroundColor: C.surface,
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.border,
            overflow: 'hidden',
            ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
          }}
        >
          <ScrollView contentContainerStyle={{ padding: 20 }} bounces={false}>
            <Text
              accessibilityRole="header"
              style={{ ...T.questionTitle, fontSize: 22, marginBottom: 16 }}
            >
              {t('dashboard.insights.consentTitle')}
            </Text>
            <Text style={{ ...T.helper, color: C.text, marginBottom: 14, lineHeight: 22 }}>
              {t('dashboard.advice.consentHelper')}
            </Text>
            <Text style={{ ...T.helper, color: C.text, marginBottom: 14, lineHeight: 22 }}>
              {t('dashboard.advice.consentLabel')}
            </Text>
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 20, lineHeight: 22, fontSize: 13 }}>
              {t('dashboard.advice.disclaimer')}
            </Text>
            <PrimaryButton onPress={handleAccept} style={{ marginBottom: 12 }}>
              {t('dashboard.insights.consentAccept')}
            </PrimaryButton>
            <TextLinkButton
              label={t('dashboard.insights.consentDecline')}
              onPress={onClose}
              centered
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
