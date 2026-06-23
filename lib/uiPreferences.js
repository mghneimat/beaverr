import { getData, setData } from './storage';

export const UI_PREFS_KEY = 'beaverr_ui_preferences';

/**
 * @returns {Promise<{ sidebarVisited: boolean, sidebarCollapsed: boolean, dashboardDisplayFrequency?: string }>}
 */
export async function getUiPreferences() {
  const prefs = await getData(UI_PREFS_KEY);
  return {
    sidebarVisited: !!prefs?.sidebarVisited,
    sidebarCollapsed: !!prefs?.sidebarCollapsed,
    dashboardDisplayFrequency: prefs?.dashboardDisplayFrequency || 'monthly',
    colorScheme: prefs?.colorScheme === 'dark' ? 'dark' : 'light',
  };
}

/**
 * @param {Partial<{ sidebarVisited: boolean, sidebarCollapsed: boolean, dashboardDisplayFrequency: string, colorScheme: 'light' | 'dark' }>} patch
 */
export async function setUiPreferences(patch) {
  const current = await getUiPreferences();
  await setData(UI_PREFS_KEY, { ...current, ...patch });
}
