/** @typedef {'saved'|'deleted'|'reminderActivated'|'reminderDisabled'|'reminderUpdated'|'cycleCalendarLocked'|'cycleStartUpdated'|'cycleDatesUpdated'|'spendingSaved'|'adjustmentSaved'|'stashCreated'|'stashDeleted'|'stashTransferred'|'stashTransferEmpty'|'stashRenamed'|'commitmentRenewed'|'commitmentDeleted'|'questionnaireProgressSaved'|'questionnaireProgressDeleted'} DashboardToastKind */

/** @typedef {{ kind: DashboardToastKind, id: number }} DashboardToastPayload */

/** @type {Set<(payload: DashboardToastPayload) => void>} */
const listeners = new Set();

/** @type {DashboardToastPayload[]} */
const pendingQueue = [];

/**
 * @param {DashboardToastPayload} payload
 */
function dispatchToast(payload) {
  listeners.forEach((fn) => fn(payload));
}

/**
 * Show a pill snackbar (saved / deleted).
 * @param {DashboardToastKind} kind
 */
export function emitDashboardToast(kind) {
  const payload = { kind, id: Date.now() };
  if (listeners.size === 0) {
    pendingQueue.push(payload);
    return;
  }
  dispatchToast(payload);
}

/**
 * Emit after navigation has painted — use when leaving onboarding for dashboard.
 * @param {DashboardToastKind} kind
 */
export function emitDashboardToastAfterNavigation(kind) {
  const fire = () => emitDashboardToast(kind);
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => requestAnimationFrame(fire));
    return;
  }
  setTimeout(fire, 16);
}

/** @param {(payload: DashboardToastPayload) => void} listener */
export function subscribeDashboardToast(listener) {
  listeners.add(listener);
  if (pendingQueue.length > 0) {
    const queued = pendingQueue.splice(0, pendingQueue.length);
    queued.forEach((payload) => listener(payload));
  }
  return () => listeners.delete(listener);
}
