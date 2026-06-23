import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/** @deprecated Other costs merged into subscriptions — redirect for legacy routes. */
export default function OtherCostsRedirect() {
  const router = useRouter();

  useEffect(() => {
    navigateForward('/(onboarding)/subscriptions');
  }, [router]);

  return null;
}
