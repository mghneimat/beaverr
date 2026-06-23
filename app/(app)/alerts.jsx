import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import RemindersContent from '../../components/dashboard/RemindersContent';

export default function AlertsScreen() {
  return (
    <DashboardPageShell
      titleKey="dashboard.alerts"
      roleHintKey="dashboard.remindersScreen.subtitle"
    >
      {(bundle) => <RemindersContent bundle={bundle} />}
    </DashboardPageShell>
  );
}
