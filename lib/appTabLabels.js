/** i18n keys for main app tab page titles */
export const APP_TAB_LABEL_MAP = {
  dashboard: 'dashboard.title',
  income: 'dashboard.income',
  costs: 'dashboard.expenses',
  budget: 'dashboard.budget',
  tracker: 'dashboard.tracker',
  goals: 'dashboard.goals',
  savings: 'dashboard.savings',
  summary: 'dashboard.summary',
  profile: 'dashboard.profile',
  alerts: 'dashboard.alerts',
  subscriptions: 'dashboard.subscriptions',
  'account-settings': 'dashboard.accountSettings',
  'help-feedback': 'dashboard.helpFeedback',
};

/**
 * Resolve the current screen title for in-page headers.
 * @param {string[]} segments — from useSegments()
 * @param {(key: string) => string} t
 * @param {Record<string, string>} [editTitleKeys] — sectionEditRegistry SECTION_TITLE_KEYS
 */
export function resolveAppTabTitle(segments, t, editTitleKeys = {}) {
  if (!segments?.length) return '';

  const appIdx = segments.indexOf('(app)');
  const routeParts = appIdx >= 0 ? segments.slice(appIdx + 1) : segments;

  if (routeParts[0] === 'edit' && routeParts[1]) {
    const editKey = editTitleKeys[routeParts[1]];
    return editKey ? t(editKey) : '';
  }

  const current = routeParts[routeParts.length - 1] || '';
  const labelKey = APP_TAB_LABEL_MAP[current];
  return labelKey ? t(labelKey) : '';
}
