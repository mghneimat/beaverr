import { formatCurrency } from './finance';

/**
 * Human-readable month-end routing label for previews and history.
 * @param {(key: string, params?: object) => string} t
 * @param {{
 *   route: { amount: number, excessToLoose?: number },
 *   strategy: string,
 *   resetDestination?: string|null,
 *   otherGoalNote?: string|null,
 * }} preview
 * @param {string} currency
 */
export function formatMonthEndDestination(t, preview, currency) {
  const { route, strategy, resetDestination, otherGoalNote } = preview;
  if (strategy === 'free' || strategy === 'capped') {
    return t('dashboard.trackerScreen.monthly.route.rolloverFree');
  }
  if (resetDestination === 'savings') {
    return t('dashboard.trackerScreen.monthly.route.savings');
  }
  if (resetDestination === 'otherGoal') {
    return t('dashboard.trackerScreen.monthly.route.otherGoal', {
      name: otherGoalNote || t('dashboard.savingsScreen.otherGoalFallback'),
    });
  }
  return t('dashboard.trackerScreen.monthly.route.looseMoney');
}

const HISTORY_DEST_KEYS = {
  rollover: 'dashboard.monthEndHistory.rollover',
  savings: 'dashboard.monthEndHistory.savings',
  looseMoney: 'dashboard.monthEndHistory.looseMoney',
  otherGoal: 'dashboard.monthEndHistory.otherGoal',
};

/**
 * @param {(key: string) => string} t
 * @param {string} destination
 */
export function formatMonthEndHistoryDestination(t, destination) {
  const key = HISTORY_DEST_KEYS[destination];
  return key ? t(key) : destination;
}
