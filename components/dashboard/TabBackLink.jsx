import { useRouter } from 'expo-router';
import { navigateBackFromTabDetail, navigateBackToAppTab } from '../../lib/screenTransition';
import BackLink from '../ui/BackLink';

/**
 * Text back link for hidden dashboard routes (e.g. reduce-costs → goals).
 */
export default function TabBackLink({ route, labelKey, pop = false }) {
  const router = useRouter();

  const handlePress = () => {
    if (pop) {
      navigateBackFromTabDetail(router);
      return;
    }
    navigateBackToAppTab(router, route);
  };

  return (
    <BackLink onPress={handlePress} labelKey={labelKey} />
  );
}
