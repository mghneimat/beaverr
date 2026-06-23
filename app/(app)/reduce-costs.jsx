import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import ReduceCostsContent from '../../components/dashboard/ReduceCostsContent';

export default function ReduceCostsScreen() {
  return (
    <DashboardPageShell>
      {(bundle) => <ReduceCostsContent bundle={bundle} />}
    </DashboardPageShell>
  );
}