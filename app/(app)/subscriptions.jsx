import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import SubscriptionsContent from '../../components/dashboard/SubscriptionsContent';

export default function SubscriptionsScreen() {
  return (
    <DashboardPageShell
      titleKey="dashboard.subscriptions"
      roleHintKey="dashboard.tabRoles.subscriptions"
    >
      {() => <SubscriptionsContent />}
    </DashboardPageShell>
  );
}
