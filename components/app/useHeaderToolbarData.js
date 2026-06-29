import { useCallback, useEffect, useState } from 'react';
import { loadHeaderToolbarData } from '../../lib/headerToolbarData';
import { subscribeDashboardRefresh } from '../../lib/dashboardRefresh';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useI18n } from '../../lib/i18n';

/**
 * Alert count + household snapshot for the app top nav toolbar.
 */
export default function useHeaderToolbarData() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [alertCount, setAlertCount] = useState(0);
  const [household, setHousehold] = useState(null);
  const [accountFields, setAccountFields] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await loadHeaderToolbarData(t, user?.id);
      setAlertCount(data.alertCount);
      setHousehold(data.household);
      setAccountFields(data.accountFields);
    } catch {
      /* header chrome degrades gracefully */
    }
  }, [t, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeDashboardRefresh(load), [load]);

  return { alertCount, household, accountFields, reload: load };
}
