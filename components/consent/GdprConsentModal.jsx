import { View, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import PrimaryButton from '../ui/PrimaryButton';
import { C, R, S, T } from '../../constants/onboarding-theme';

const BODY_KEYS = [
  'onboarding.consent.bodyIntro',
  'onboarding.consent.bodyRights',
  'onboarding.consent.bodyLegal',
];

/**
 * Scrollable GDPR consent details — opened from sign-up checkbox link.
 */
export default function GdprConsentModal({ visible, onClose }) {
  const { t } = useI18n();

  if (!visible) {
    return null;
  }

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
              {t('onboarding.consent.title')}
            </Text>
            {BODY_KEYS.map((key) => (
              <Text
                key={key}
                style={{ ...T.helper, color: C.text, marginBottom: 14, lineHeight: 22 }}
              >
                {t(key)}
              </Text>
            ))}
            <PrimaryButton onPress={onClose} style={{ marginTop: 6 }}>
              {t('common.done')}
            </PrimaryButton>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
