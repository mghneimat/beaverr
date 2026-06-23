import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import AppearanceContent from '../../components/dashboard/AppearanceContent';

export default function AppearanceScreen() {
  return (
    <DashboardPageShell
      titleKey="dashboard.appearance.title"
      roleHintKey="dashboard.tabRoles.accountSettings"
    >
      {() => <AppearanceContent />}
    </DashboardPageShell>
  );
}
