import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import BackLink from '../ui/BackLink';
import PrimaryButton from '../ui/PrimaryButton';
import { C } from '../../constants/onboarding-theme';

export function useAuthScreenBack() {
  const router = useRouter();

  return () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/welcome');
  };
}

/**
 * @param {{ variant?: 'link' | 'footer', onPress?: () => void }} props
 */
export default function AuthScreenBackLink({ variant = 'link', onPress }) {
  const { t } = useI18n();
  const goBack = useAuthScreenBack();
  const handlePress = onPress ?? goBack;

  if (variant === 'footer') {
    return (
      <PrimaryButton
        variant="outline"
        fullWidth
        onPress={handlePress}
        accessibilityLabel={t('common.back')}
        textStyle={{ color: C.muted }}
      >
        {t('common.back')}
      </PrimaryButton>
    );
  }

  return (
    <BackLink
      compact
      onPress={handlePress}
    />
  );
}
