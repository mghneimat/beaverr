import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import AppLoadingScreen from '../../components/app/AppLoadingScreen';
import { ensureDefaultLocation } from '../../lib/onboarding/ensureDefaultLocation';

/** Legacy route — location step removed; forward to citizenship. */
export default function LocationRedirectScreen() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    (async () => {
      await ensureDefaultLocation();
      router.replace('/(onboarding)/citizenship');
    })();
  }, [router]);

  return <AppLoadingScreen label={t('common.loading')} />;
}
