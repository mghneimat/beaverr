import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import AccountSettingsContent from '../../components/dashboard/AccountSettingsContent';

export default function AccountSettingsScreen() {
  return (
    <DashboardPageShell
      titleKey="dashboard.accountSettings"
      roleHintKey="dashboard.tabRoles.accountSettings"
    >
      {() => <AccountSettingsContent />}
    </DashboardPageShell>
  );
}
