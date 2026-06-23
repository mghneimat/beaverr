import DashboardPageShell from '../../../components/dashboard/DashboardPageShell';
import SavingsContent from '../../../components/dashboard/SavingsContent';
import { getCurrencySymbol } from '../../../lib/currency';

export default function SavingsScreen() {
  return (
    <DashboardPageShell titleKey="dashboard.savings">
      {(bundle) => (
        <SavingsContent
          bundle={bundle}
          currency={getCurrencySymbol(bundle.financials.currencyCode)}
        />
      )}
    </DashboardPageShell>
  );
}
