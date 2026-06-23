/** @typedef {'saved'|'deleted'|'reminderActivated'|'reminderDisabled'|'reminderUpdated'|'cycleCalendarLocked'|'cycleStartUpdated'|'spendingSaved'|'adjustmentSaved'|'stashCreated'|'stashDeleted'|'stashTransferred'|'stashTransferEmpty'|'stashRenamed'} DashboardToastKind */

/** @typedef {{ kind: DashboardToastKind, id: number }} DashboardToastPayload */

/** @type {Set<(payload: DashboardToastPayload) => void>} */
const listeners = new Set();

/**
 * Show a pill snackbar (saved / deleted).
 * @param {DashboardToastKind} kind
 */
export function emitDashboardToast(kind) {
  const payload = { kind, id: Date.now() };
  listeners.forEach((fn) => fn(payload));
}

/** @param {(payload: DashboardToastPayload) => void} listener */
export function subscribeDashboardToast(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
