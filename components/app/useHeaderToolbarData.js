import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { loadHeaderToolbarData } from '../../lib/headerToolbarData';
import { resolveProfileDisplayName } from '../../lib/profileDisplay';
import { subscribeDashboardRefresh } from '../../lib/dashboardRefresh';

/**
 * Alert count + profile name for the app top nav toolbar.
 */
export default function useHeaderToolbarData() {
  const { t } = useI18n();
  const [alertCount, setAlertCount] = useState(0);
  const [profileName, setProfileName] = useState(undefined);

  const load = useCallback(async () => {
    try {
      const data = await loadHeaderToolbarData(t);
      setAlertCount(data.alertCount);
      setProfileName(resolveProfileDisplayName(data.household, t));
    } catch {
      /* header chrome degrades gracefully */
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeDashboardRefresh(load), [load]);

  return { alertCount, profileName };
}
