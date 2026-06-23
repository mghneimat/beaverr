import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import ExpensesContent from '../../components/dashboard/ExpensesContent';
import { useDashboardFrequency } from '../../lib/useDashboardFrequency';

export default function CostsScreen() {
  const { frequency, setFrequency } = useDashboardFrequency('monthly');

  return (
    <DashboardPageShell
      titleKey="dashboard.expenses"
      roleHintKey="dashboard.tabRoles.expenses"
    >
      {(bundle) => (
        <ExpensesContent
          bundle={bundle}
          frequency={frequency}
          setFrequency={setFrequency}
        />
      )}
    </DashboardPageShell>
  );
}
