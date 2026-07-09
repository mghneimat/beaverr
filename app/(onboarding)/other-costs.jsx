import { useEffect } from 'react';
import { navigateForward } from '../../lib/onboardingNavigation';

/** @deprecated Other costs merged into subscriptions — redirect for legacy routes. */
export default function OtherCostsRedirect() {
  useEffect(() => {
    navigateForward('/(onboarding)/subscriptions');
  }, []);

  return null;
}
