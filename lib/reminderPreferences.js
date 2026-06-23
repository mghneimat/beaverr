import { getData, setData } from './storage';
import { daysUntil, parseAlertDate } from './alertDates';

export const REMINDER_PREFS_KEY = 'beaverr_reminder_prefs';

/** @typedef {'push'|'email'} ReminderChannel */

/**
 * @typedef {Object} ReminderPreference
 * @property {boolean} enabled
 * @property {number} leadDays
 * @property {string|null} [remindOnDate]
 * @property {ReminderChannel[]} [reminderTypes]
 */

export const REMINDER_CHANNEL_OPTIONS = /** @type {const} */ (['push', 'email']);

/** @type {ReminderPreference} */
export const DEFAULT_REMINDER_PREF = {
  enabled: true,
  leadDays: 7,
  remindOnDate: null,
  reminderTypes: [],
};

/**
 * @param {unknown} types
 * @returns {ReminderChannel[]}
 */
export function normalizeReminderTypes(types) {
  if (!Array.isArray(types)) return [];
  return REMINDER_CHANNEL_OPTIONS.filter((key) => types.includes(key));
}

/** Draft editor default — push when nothing stored yet. */
export function resolveDraftReminderTypes(types) {
  const normalized = normalizeReminderTypes(types);
  return normalized.length ? normalized : ['push'];
}

/**
 * Reminder is only ON when next payment exists, user enabled it, and ≥1 type is set.
 * @param {ReminderPreference|null|undefined} pref
 * @param {{ hasNextPayment?: boolean }} [context]
 * @returns {boolean}
 */
export function isReminderEffectivelyEnabled(pref, { hasNextPayment = true } = {}) {
  if (!hasNextPayment) return false;
  if (pref?.enabled === false) return false;
  return normalizeReminderTypes(pref?.reminderTypes).length > 0;
}

/**
 * Earliest allowed reminder date — tomorrow (local calendar day).
 * @param {Date} [now]
 * @returns {Date}
 */
export function getReminderMinSelectableDate(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

/**
 * Reminder dates must be tomorrow or later (not today or past).
 * @param {string|null|undefined} dateStr DD/MM/YYYY
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isReminderDateAllowed(dateStr, now = new Date()) {
  if (!dateStr?.trim?.()) return false;
  const target = parseAlertDate(dateStr.trim());
  if (!target) return false;
  return daysUntil(target, now) >= 1;
}

/**
 * @param {ReminderPreference|null|undefined} pref
 * @param {{ hasNextPayment?: boolean }} [context]
 */
function snapshotReminderPref(pref, { hasNextPayment = true } = {}) {
  return {
    effectivelyEnabled: isReminderEffectivelyEnabled(pref, { hasNextPayment }),
    remindOnDate: pref?.remindOnDate?.trim?.() || null,
    reminderTypes: normalizeReminderTypes(pref?.reminderTypes),
    leadDays: pref?.leadDays > 0 ? pref.leadDays : DEFAULT_REMINDER_PREF.leadDays,
  };
}

/**
 * Whether reminder settings changed between two pref snapshots.
 * @param {ReminderPreference|null|undefined} before
 * @param {ReminderPreference|null|undefined} after
 * @param {{ hasNextPayment?: boolean }} [context]
 * @returns {boolean}
 */
export function hasReminderPrefChanged(before, after, context = {}) {
  const prev = snapshotReminderPref(before, context);
  const next = snapshotReminderPref(after, context);
  if (prev.effectivelyEnabled !== next.effectivelyEnabled) return true;
  if (prev.remindOnDate !== next.remindOnDate) return true;
  if (prev.leadDays !== next.leadDays) return true;
  if (prev.reminderTypes.length !== next.reminderTypes.length) return true;
  return prev.reminderTypes.some((type, index) => type !== next.reminderTypes[index]);
}

/** @typedef {'reminderActivated'|'reminderDisabled'|'reminderUpdated'} ReminderSaveToastKind */

/**
 * Pick dashboard toast after a successful reminder save.
 * @param {ReminderPreference|null|undefined} before
 * @param {ReminderPreference|null|undefined} after
 * @param {{ hasNextPayment?: boolean }} [context]
 * @returns {ReminderSaveToastKind|null}
 */
export function resolveReminderSaveToastKind(before, after, context = {}) {
  if (!hasReminderPrefChanged(before, after, context)) return null;
  const prev = snapshotReminderPref(before, context);
  const next = snapshotReminderPref(after, context);
  if (prev.effectivelyEnabled !== next.effectivelyEnabled) {
    return next.effectivelyEnabled ? 'reminderActivated' : 'reminderDisabled';
  }
  return 'reminderUpdated';
}

/**
 * @param {ReminderPreference|null|undefined} pref
 * @param {(key: string, params?: object) => string} t
 * @returns {string}
 */
export function formatReminderDateLabel(pref, t, { hasNextPayment = true } = {}) {
  if (!isReminderEffectivelyEnabled(pref, { hasNextPayment }) || !pref?.remindOnDate) {
    return t('dashboard.expensesScreen.noDate');
  }
  return pref.remindOnDate;
}

/**
 * @param {ReminderPreference|null|undefined} pref
 * @param {(key: string, params?: object) => string} t
 * @returns {string}
 */
export function formatReminderTypesLabel(pref, t, { hasNextPayment = true } = {}) {
  if (!isReminderEffectivelyEnabled(pref, { hasNextPayment })) {
    return t('dashboard.expensesScreen.noDate');
  }
  const types = normalizeReminderTypes(pref.reminderTypes);
  if (!types.length) return t('dashboard.remindersScreen.reminderTypePleaseSelect');
  return types.map((key) => t(`dashboard.remindersScreen.reminderTypes.${key}`)).join(', ');
}

/**
 * @param {ReminderPreference|null|undefined} pref
 * @param {(key: string, params?: object) => string} t
 * @param {{ short?: boolean }} [options]
 * @returns {string[]|null}
 */
export function getReminderTypeDisplayLabels(pref, t, { short = false, hasNextPayment = true } = {}) {
  if (!isReminderEffectivelyEnabled(pref, { hasNextPayment })) return null;
  const types = normalizeReminderTypes(pref.reminderTypes);
  if (!types.length) return null;
  const base = short
    ? 'dashboard.remindersScreen.reminderTypesShort.'
    : 'dashboard.remindersScreen.reminderTypes.';
  return types.map((key) => t(`${base}${key}`));
}

/**
 * @returns {Promise<Record<string, ReminderPreference>>}
 */
export async function getReminderPrefs() {
  const stored = await getData(REMINDER_PREFS_KEY);
  return stored && typeof stored === 'object' ? stored : {};
}

/**
 * @param {string} reminderId
 * @param {Partial<ReminderPreference>} patch
 */
export async function setReminderPref(reminderId, patch) {
  const prefs = await getReminderPrefs();
  const current = prefs[reminderId] || { ...DEFAULT_REMINDER_PREF };
  const nextTypes = patch.reminderTypes !== undefined
    ? normalizeReminderTypes(patch.reminderTypes)
    : normalizeReminderTypes(current.reminderTypes);
  const requestedEnabled = patch.enabled ?? current.enabled;
  const nextEnabled = requestedEnabled && nextTypes.length > 0 ? requestedEnabled : false;
  const next = {
    enabled: nextEnabled,
    leadDays: Math.max(1, Math.min(90, Number(patch.leadDays ?? current.leadDays) || DEFAULT_REMINDER_PREF.leadDays)),
    remindOnDate: patch.remindOnDate !== undefined
      ? (patch.remindOnDate?.trim?.() ? patch.remindOnDate.trim() : patch.remindOnDate || null)
      : (current.remindOnDate ?? null),
    reminderTypes: nextTypes,
  };
  await setData(REMINDER_PREFS_KEY, { ...prefs, [reminderId]: next });
  return next;
}

/**
 * Global default lead days from settings (fallback 7).
 * @returns {Promise<number>}
 */
export async function getDefaultLeadDays() {
  const settings = await getData('beaverr_settings');
  const days = Number(settings?.alertLeadDays);
  return days > 0 ? days : DEFAULT_REMINDER_PREF.leadDays;
}

/**
 * @param {string} reminderId
 * @param {Record<string, ReminderPreference>} prefs
 * @param {number} defaultLeadDays
 * @returns {ReminderPreference}
 */
export function resolveReminderPref(reminderId, prefs, defaultLeadDays) {
  const pref = prefs[reminderId];
  if (!pref) {
    return {
      enabled: DEFAULT_REMINDER_PREF.enabled,
      leadDays: defaultLeadDays,
      remindOnDate: null,
      reminderTypes: [],
    };
  }
  return {
    enabled: pref.enabled !== false,
    leadDays: pref.leadDays > 0 ? pref.leadDays : defaultLeadDays,
    remindOnDate: pref.remindOnDate || null,
    reminderTypes: normalizeReminderTypes(pref.reminderTypes),
  };
}
