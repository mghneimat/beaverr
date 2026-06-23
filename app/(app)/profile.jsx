import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import ProfileContent from '../../components/dashboard/ProfileContent';

export default function ProfileScreen() {
  return (
    <DashboardPageShell titleKey="dashboard.profile" roleHintKey="dashboard.tabRoles.profile">
      {(bundle) => <ProfileContent bundle={bundle} />}
    </DashboardPageShell>
  );
}
