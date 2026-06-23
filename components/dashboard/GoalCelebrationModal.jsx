import { Modal, Pressable, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';

export default function GoalCelebrationModal({
  visible,
  goalName,
  onDismiss,
}) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(30, 58, 95, 0.35)',
          justifyContent: 'center',
          padding: 24,
        }}
        onPress={onDismiss}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            maxWidth: 440,
            width: '100%',
            alignSelf: 'center',
            backgroundColor: C.surface,
            borderRadius: R.card,
            borderTopWidth: 4,
            borderTopColor: C.delight,
            padding: 24,
          }}
        >
          <Text style={{ ...T.cardTitle, marginBottom: 8, color: C.delight }}>
            {t('dashboard.goalsScreen.celebration.title')}
          </Text>
          <Text style={{ ...T.helper, marginBottom: 20 }}>
            {t('dashboard.goalsScreen.celebration.body', { name: goalName })}
          </Text>
          <PrimaryButton onPress={onDismiss}>
            {t('dashboard.goalsScreen.celebration.dismiss')}
          </PrimaryButton>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
