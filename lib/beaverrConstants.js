/**
 * Beaverr product constants — brand strings and local storage key registry.
 */

/** @type {const} */
export const BRAND_NAME = 'Beaverr';

/** @type {const} */
export const STORAGE_KEYS = {
  consent: 'beaverr_consent',
  aiConsent: 'beaverr_ai_consent',
  onboarding: 'beaverr_onboarding',
  household: 'beaverr_household',
  location: 'beaverr_location',
  occupation: 'beaverr_occupation',
  income: 'beaverr_income',
  costs: 'beaverr_costs',
  housing: 'beaverr_housing',
  transport: 'beaverr_transport',
  health: 'beaverr_health',
  childrenCosts: 'beaverr_children_costs',
  pets: 'beaverr_pets',
  subscriptions: 'beaverr_subscriptions',
  otherCosts: 'beaverr_other_costs',
  debts: 'beaverr_debts',
  budget: 'beaverr_budget',
  dailyLog: 'beaverr_daily_log',
  budgetCycles: 'beaverr_budget_cycles',
  cycleAdjustments: 'beaverr_cycle_adjustments',
  obligations: 'beaverr_obligations',
  alerts: 'beaverr_alerts',
  goals: 'beaverr_goals',
  goalsMigrated: 'beaverr_goals_migrated',
  reminderPrefs: 'beaverr_reminder_prefs',
  settings: 'beaverr_settings',
  uiPreferences: 'beaverr_ui_preferences',
  questionnaireSnapshot: 'beaverr_questionnaire_snapshot',
  quickSetupSnapshot: 'beaverr_quick_setup_snapshot',
  storageMigrated: 'beaverr_storage_migrated',
  syncMeta: 'beaverr_sync_meta',
  pendingSignup: 'beaverr_pending_signup',
};

/** @type {Record<string, string>} */
export const LEGACY_STORAGE_ALIASES = Object.fromEntries(
  Object.values(STORAGE_KEYS).map((key) => [
    key.replace(/^beaverr_/, 'pocketos_'),
    key,
  ]),
);

/** All persisted data keys cleared on revoke / reset. */
export const ALL_CLEARABLE_STORAGE_KEYS = [
  STORAGE_KEYS.consent,
  STORAGE_KEYS.aiConsent,
  STORAGE_KEYS.onboarding,
  STORAGE_KEYS.household,
  STORAGE_KEYS.location,
  STORAGE_KEYS.occupation,
  STORAGE_KEYS.income,
  STORAGE_KEYS.costs,
  STORAGE_KEYS.debts,
  STORAGE_KEYS.budget,
  STORAGE_KEYS.dailyLog,
  STORAGE_KEYS.budgetCycles,
  STORAGE_KEYS.cycleAdjustments,
  STORAGE_KEYS.obligations,
  STORAGE_KEYS.alerts,
  STORAGE_KEYS.goals,
  STORAGE_KEYS.goalsMigrated,
  STORAGE_KEYS.reminderPrefs,
  STORAGE_KEYS.settings,
  STORAGE_KEYS.uiPreferences,
  STORAGE_KEYS.housing,
  STORAGE_KEYS.transport,
  STORAGE_KEYS.health,
  STORAGE_KEYS.childrenCosts,
  STORAGE_KEYS.pets,
  STORAGE_KEYS.subscriptions,
  STORAGE_KEYS.otherCosts,
  STORAGE_KEYS.questionnaireSnapshot,
  STORAGE_KEYS.quickSetupSnapshot,
  STORAGE_KEYS.storageMigrated,
  STORAGE_KEYS.pendingSignup,
];

/**
 * @param {string} key
 * @returns {string}
 */
export function resolveStorageKey(key) {
  if (!key) return key;
  return LEGACY_STORAGE_ALIASES[key] || key;
}

/**
 * @param {string} key
 * @returns {boolean}
 */
export function isLegacyStorageKey(key) {
  return Boolean(key && key.startsWith('pocketos_'));
}
