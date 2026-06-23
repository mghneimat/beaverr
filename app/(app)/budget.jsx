import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import BudgetContent from '../../components/dashboard/BudgetContent';
import { useDashboardFrequency } from '../../lib/useDashboardFrequency';

export default function BudgetScreen() {
  const { frequency, setFrequency } = useDashboardFrequency('monthly');

  return (
    <DashboardPageShell
      titleKey="dashboard.budget"
      roleHintKey="dashboard.tabRoles.budget"
    >
      {(bundle) => (
        <BudgetContent
          bundle={bundle}
          frequency={frequency}
          setFrequency={setFrequency}
        />
      )}
    </DashboardPageShell>
  );
}
