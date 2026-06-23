import { useLocalSearchParams } from 'expo-router';
import DashboardPageShell from '../../../components/dashboard/DashboardPageShell';
import GoalDetailContent from '../../../components/dashboard/GoalDetailContent';

export default function GoalDetailScreen() {
  const { goalId } = useLocalSearchParams();
  const id = Array.isArray(goalId) ? goalId[0] : goalId;

  return (
    <DashboardPageShell>
      {(bundle) => <GoalDetailContent bundle={bundle} goalId={id} />}
    </DashboardPageShell>
  );
}
