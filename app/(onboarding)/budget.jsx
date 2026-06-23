import { Redirect } from 'expo-router';

/** Legacy route — onboarding budget screen moved to budget-setup. */
export default function BudgetLegacyRedirect() {
  return <Redirect href="/(onboarding)/budget-setup" />;
}
