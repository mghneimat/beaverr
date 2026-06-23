import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import TrackerContent from '../../components/dashboard/TrackerContent';
import { getCurrencySymbol } from '../../lib/currency';

export default function TrackerScreen() {
  return (
    <DashboardPageShell titleKey="dashboard.tracker">
      {(bundle) => (
        <TrackerContent
          bundle={bundle}
          currency={getCurrencySymbol(bundle.financials.currencyCode)}
        />
      )}
    </DashboardPageShell>
  );
}
