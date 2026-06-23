import { getData, setData } from './storage';
import { EDIT_SECTION_ROUTES } from './sectionEditPaths';
import { buildReminderRows, resolveReminderDateValue } from './reminderSchedule';
import { parseAlertDate, daysUntil } from './alertDates';
import {
  getReminderPrefs,
  getDefaultLeadDays,
  resolveReminderPref,
} from './reminderPreferences';

export { parseAlertDate, daysUntil } from './alertDates';

/**
 * @typedef {Object} AlertRecord
 * @property {string} id
 * @property {string} type
 * @property {'low'|'medium'|'high'} urgency
 * @property {string|null} relatedId
 * @property {'active'|'snoozed'|'dismissed'} status
 * @property {string|null} snoozedUntil
 * @property {string} messageKey
 * @property {Record<string, string|number>} [messageParams]
 * @property {string} [actionRoute]
 * @property {string} [editRoute]
 */

/**
 * Scan non-scheduled alerts (high APR, etc.).
 * Date-based reminders use scanReminderAlerts via syncAlerts.
 * @param {Object} raw
 * @param {(key: string, params?: object) => string} t
 * @returns {AlertRecord[]}
 */
export function scanAlerts(raw, t) {
  const { debts = [] } = raw;
  const alerts = [];

  debts.forEach((debt, idx) => {
    const apr = parseFloat(debt.apr || 0);
    if (apr > 20) {
      const typeKey = `onboarding.debts.debtDetails.${debt.type || 'other'}`;
      const translated = t(typeKey);
      const name = translated !== typeKey ? translated : t('dashboard.alertsScreen.fallback.debt');
      alerts.push({
        id: `high_apr-${idx}`,
        type: 'debt_high_apr',
        urgency: 'high',
        relatedId: String(idx),
        status: 'active',
        messageKey: 'dashboard.alertsScreen.types.highApr',
        messageParams: { name, apr },
        actionRoute: '/(app)/costs',
        editRoute: EDIT_SECTION_ROUTES.debts,
      });
    }
  });

  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

/**
 * @param {import('./reminderSchedule').ReminderRow[]} rows
 * @param {Record<string, import('./reminderPreferences').ReminderPreference>} prefs
 * @param {number} defaultLeadDays
 * @param {(key: string, params?: object) => string} t
 * @param {Date} [now]
 * @returns {AlertRecord[]}
 */
export function scanReminderAlerts(rows, prefs, defaultLeadDays, t, now = new Date()) {
  const alerts = [];

  rows.forEach((row) => {
    const pref = resolveReminderPref(row.reminderId, prefs, defaultLeadDays);
    if (!pref.enabled) return;

    if (pref.remindOnDate) {
      const remindTarget = parseAlertDate(pref.remindOnDate);
      if (!remindTarget) return;
      const daysUntilRemind = daysUntil(remindTarget, now);
      if (daysUntilRemind > 0) return;
    } else {
      const dateStr = resolveReminderDateValue(row);
      const target = parseAlertDate(dateStr);
      if (!target) return;
      const days = daysUntil(target, now);
      if (days < 0 || days > pref.leadDays) return;
    }

    const dateStr = resolveReminderDateValue(row);
    const target = parseAlertDate(dateStr);
    if (!target) return;
    const days = daysUntil(target, now);

    const messageKey = row.dateType === 'renewal'
      ? 'dashboard.alertsScreen.types.subscriptionRenewal'
      : row.dateType === 'end'
        ? 'dashboard.alertsScreen.types.healthExpiry'
        : row.reminderId.startsWith('mot-')
          ? 'dashboard.alertsScreen.types.motDue'
          : row.reminderId.startsWith('rec-transport-ins')
            ? 'dashboard.alertsScreen.types.insuranceRenewal'
            : 'dashboard.alertsScreen.types.promoExpiry';

    const messageParams = row.dateType === 'end'
      ? { member: row.name, days }
      : { name: row.name, days };

    alerts.push({
      id: `reminder-${row.reminderId}`,
      type: 'expense_date_reminder',
      urgency: days <= 3 ? 'high' : days <= 7 ? 'medium' : 'low',
      relatedId: row.reminderId,
      status: 'active',
      messageKey,
      messageParams,
      actionRoute: row.actionRoute || '/(app)/alerts',
    });
  });

  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

/**
 * Merge scanned alerts with stored dismiss/snooze state and persist.
 * @param {Object} raw
 * @param {(key: string, params?: object) => string} t
 * @returns {Promise<AlertRecord[]>}
 */
export async function syncAlerts(raw, t) {
  const scanned = scanAlerts(raw, t);

  const sections = raw.sections || {
    housing: raw.housing,
    transport: raw.transport,
    health: raw.health,
    subs: raw.subs,
    otherCosts: raw.otherCosts,
    childrenCosts: raw.childrenCosts,
    pets: raw.pets,
    household: raw.household,
  };

  const reminderRows = buildReminderRows(
    sections,
    raw.debts || [],
    sections.household || raw.household || null,
    t,
  );
  const prefs = await getReminderPrefs();
  const defaultLeadDays = await getDefaultLeadDays();
  const reminderAlerts = scanReminderAlerts(reminderRows, prefs, defaultLeadDays, t);

  const combined = [...scanned, ...reminderAlerts, ...(raw.goalAlerts || [])];
  const stored = (await getData('beaverr_alerts')) || [];
  const storedById = Object.fromEntries(stored.map((a) => [a.id, a]));
  const now = new Date();

  const merged = combined.map((alert) => {
    const prev = storedById[alert.id];
    if (!prev) return alert;
    if (prev.status === 'dismissed') return { ...alert, status: 'dismissed' };
    if (prev.status === 'snoozed' && prev.snoozedUntil) {
      const until = new Date(prev.snoozedUntil);
      if (until > now) return { ...alert, status: 'snoozed', snoozedUntil: prev.snoozedUntil };
    }
    return { ...alert, status: 'active' };
  });

  await setData('beaverr_alerts', merged);
  return merged;
}

/**
 * @param {AlertRecord[]} alerts
 * @param {number} [limit]
 * @returns {AlertRecord[]}
 */
export function getActiveAlerts(alerts, limit) {
  const active = alerts.filter((a) => a.status === 'active');
  return limit ? active.slice(0, limit) : active;
}

/**
 * @param {string} alertId
 */
export async function dismissAlert(alertId) {
  const stored = (await getData('beaverr_alerts')) || [];
  const updated = stored.map((a) => (
    a.id === alertId ? { ...a, status: 'dismissed' } : a
  ));
  await setData('beaverr_alerts', updated);
  return updated;
}

/**
 * @param {string} alertId
 * @param {number} snoozeDays
 */
export async function snoozeAlert(alertId, snoozeDays = 7) {
  const until = new Date();
  until.setDate(until.getDate() + snoozeDays);
  const stored = (await getData('beaverr_alerts')) || [];
  const updated = stored.map((a) => (
    a.id === alertId
      ? { ...a, status: 'snoozed', snoozedUntil: until.toISOString() }
      : a
  ));
  await setData('beaverr_alerts', updated);
  return updated;
}
