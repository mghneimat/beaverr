import { useLocalSearchParams } from 'expo-router';
import DashboardPageShell from '../../../components/dashboard/DashboardPageShell';
import SavingsStashDetailContent from '../../../components/dashboard/SavingsStashDetailContent';
import { decodeStashRouteId } from '../../../lib/stashRoutes';

export default function SavingsStashDetailScreen() {
  const { stashId } = useLocalSearchParams();
  const raw = Array.isArray(stashId) ? stashId[0] : stashId;
  const id = decodeStashRouteId(raw);

  return (
    <DashboardPageShell>
      {(bundle) => (
        <SavingsStashDetailContent
          bundle={bundle}
          stashId={id}
        />
      )}
    </DashboardPageShell>
  );
}
