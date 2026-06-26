import { useCallback, useEffect, useState } from 'react';
import { loadHeaderToolbarData } from '../../lib/headerToolbarData';
import { subscribeDashboardRefresh } from '../../lib/dashboardRefresh';

/**
 * Alert count + household snapshot for the app top nav toolbar.
 */
export default function useHeaderToolbarData() {
  const [alertCount, setAlertCount] = useState(0);
  const [household, setHousehold] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await loadHeaderToolbarData();
      setAlertCount(data.alertCount);
      setHousehold(data.household);
    } catch {
      /* header chrome degrades gracefully */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeDashboardRefresh(load), [load]);

  return { alertCount, household };
}
