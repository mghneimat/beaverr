import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import HelpFeedbackContent from '../../components/dashboard/HelpFeedbackContent';

export default function HelpFeedbackScreen() {
  return (
    <DashboardPageShell
      titleKey="dashboard.helpFeedback"
      roleHintKey="dashboard.tabRoles.helpFeedback"
    >
      {() => <HelpFeedbackContent />}
    </DashboardPageShell>
  );
}
