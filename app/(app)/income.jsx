import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import IncomeContent from '../../components/dashboard/IncomeContent';
import { useDashboardFrequency } from '../../lib/useDashboardFrequency';

export default function IncomeScreen() {
  const { frequency, setFrequency } = useDashboardFrequency('monthly');

  return (
    <DashboardPageShell
      titleKey="dashboard.income"
      roleHintKey="dashboard.tabRoles.income"
    >
      {(bundle) => (
        <IncomeContent
          bundle={bundle}
          frequency={frequency}
          setFrequency={setFrequency}
        />
      )}
    </DashboardPageShell>
  );
}
