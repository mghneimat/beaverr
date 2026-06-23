import { C } from '../constants/onboarding-theme';

/** @typedef {'good'|'alert'|'important'|'critical'} SpendingPaceLevel */

/** Pace-ahead thresholds (spentRatio − timeRatio). Tunable in one place. */
export const SPENDING_PACE_AHEAD_ALERT = 0.10;
export const SPENDING_PACE_AHEAD_IMPORTANT = 0.25;

const PACE_LEVEL_RANK = /** @type {Record<SpendingPaceLevel, number>} */ ({
  good: 0,
  alert: 1,
  important: 2,
  critical: 3,
});

/**
 * Pick the more severe spending pace level (for banner when pool vs logged views diverge).
 * @param {SpendingPaceLevel|null|undefined} a
 * @param {SpendingPaceLevel|null|undefined} b
 * @returns {SpendingPaceLevel}
 */
export function maxSpendingPaceLevel(a, b) {
  const left = a || 'good';
  const right = b || 'good';
  return PACE_LEVEL_RANK[left] >= PACE_LEVEL_RANK[right] ? left : right;
}

/**
 * @param {SpendingPaceLevel} level
 * @returns {string}
 */
export function spendingPaceColor(level) {
  if (level === 'critical') return C.danger;
  if (level === 'important') return C.cycleWarning;
  if (level === 'alert') return C.primary;
  return C.positive;
}

/** @typedef {SpendingPaceLevel|'backfillPending'} SpendingPaceBannerStatus */

/**
 * Banner surface tokens keyed by spending pace status.
 * @param {SpendingPaceBannerStatus} status
 */
export function spendingPaceBannerTheme(status) {
  if (status === 'backfillPending') {
    return {
      backgroundColor: C.infoBg,
      borderColor: C.infoBorder,
      textColor: C.infoText,
      iconColor: C.infoText,
    };
  }
  if (status === 'critical') {
    return {
      backgroundColor: C.heroExpenseBg,
      borderColor: C.heroExpenseBorder,
      textColor: C.danger,
      iconColor: C.danger,
    };
  }
  if (status === 'important') {
    return {
      backgroundColor: C.heroWarningBg,
      borderColor: C.heroWarningBorder,
      textColor: C.heroWarningValue,
      iconColor: C.cycleWarning,
    };
  }
  if (status === 'alert') {
    return {
      backgroundColor: C.infoWashBg,
      borderColor: C.infoWashBorder,
      textColor: C.primary,
      iconColor: C.primary,
    };
  }
  return {
    backgroundColor: C.heroIncomeBg,
    borderColor: C.heroIncomeBorder,
    textColor: C.positive,
    iconColor: C.positive,
  };
}

/**
 * @param {number} spentRatio
 * @param {number} timeRatio
 * @param {number} [remaining]
 * @param {number} [budgetEnvelope]
 * @returns {SpendingPaceLevel}
 */
export function resolveSpendingPaceLevel(
  spentRatio,
  timeRatio,
  remaining = 0,
  budgetEnvelope = 0,
) {
  if (budgetEnvelope <= 0 || remaining < 0 || spentRatio >= 1) {
    return 'critical';
  }
  const ahead = spentRatio - timeRatio;
  if (ahead <= 0) return 'good';
  if (ahead <= SPENDING_PACE_AHEAD_ALERT) return 'alert';
  if (ahead <= SPENDING_PACE_AHEAD_IMPORTANT) return 'important';
  return 'critical';
}

/**
 * Pace-ahead warning — compare spent share vs elapsed time share of the period.
 * @param {{
 *   spent: number,
 *   budgetEnvelope: number,
 *   elapsedUnits: number,
 *   totalUnits: number,
 *   remaining?: number,
 * }} params
 */
export function computeSpendingPace({
  spent,
  budgetEnvelope,
  elapsedUnits,
  totalUnits,
  remaining,
}) {
  const envelope = Number(budgetEnvelope) || 0;
  const spentAmount = Math.max(0, Number(spent) || 0);
  const total = Math.max(1, Number(totalUnits) || 1);
  const elapsed = Math.max(0, Math.min(Number(elapsedUnits) || 0, total));
  const timeRatio = elapsed / total;
  const spentRatio = envelope > 0 ? spentAmount / envelope : (spentAmount > 0 ? 1 : 0);
  const ahead = spentRatio - timeRatio;
  const resolvedRemaining = remaining != null
    ? Number(remaining)
    : envelope - spentAmount;

  const level = resolveSpendingPaceLevel(
    spentRatio,
    timeRatio,
    resolvedRemaining,
    envelope,
  );

  return {
    level,
    timeRatio,
    spentRatio,
    ahead,
    color: spendingPaceColor(level),
  };
}

/**
 * i18n key suffix under dashboard.spendingPace.*
 * @param {SpendingPaceLevel|null|undefined} level
 * @returns {string}
 */
export function spendingPaceMessageKey(level) {
  return level || 'good';
}

/**
 * Top banner — backfill hint when on plan; pace warning wins when ahead of plan.
 * Active pay cycles always show the banner (including green on-plan state).
 * @param {{
 *   backfillPending?: boolean,
 *   level?: SpendingPaceLevel|null,
 *   timeRatio?: number,
 *   spentRatio?: number,
 *   scope?: 'cycle'|'month'|'week'|string,
 * }} params
 */
export function resolveSpendingPaceBanner({
  backfillPending = false,
  level,
  timeRatio,
  spentRatio,
  scope,
}) {
  const paceLevel = level || 'good';
  const paceAlert = paceLevel !== 'good';
  const showDetail = timeRatio != null && spentRatio != null;

  if (backfillPending && !paceAlert) {
    return {
      visible: true,
      status: /** @type {SpendingPaceBannerStatus} */ ('backfillPending'),
      messageKey: 'backfillPending',
      showDetail: false,
      showBackfillNote: false,
    };
  }

  if (!paceAlert) {
    if (scope === 'cycle') {
      return {
        visible: true,
        status: 'good',
        messageKey: 'good',
        showDetail,
        showBackfillNote: false,
      };
    }
    return { visible: false };
  }

  return {
    visible: true,
    status: paceLevel,
    messageKey: paceLevel,
    showDetail,
    showBackfillNote: backfillPending,
  };
}

/**
 * Show inline pace status when not hidden by backfill-only state.
 * @param {SpendingPaceLevel|null|undefined} level
 * @param {boolean} [backfillPending]
 */
export function shouldShowSpendingPaceStatus(level, backfillPending = false) {
  const paceLevel = level || 'good';
  return !backfillPending || paceLevel !== 'good';
}

/**
 * @param {number} ratio 0..1+
 * @returns {string}
 */
export function formatSpendingPacePercent(ratio) {
  if (!Number.isFinite(ratio)) return '0%';
  return `${Math.round(Math.max(0, ratio) * 100)}%`;
}

/**
 * User-facing spent share for banner/detail — logged spend vs pace pool-impact ratio.
 * @param {{ spentRatio?: number, displaySpentRatio?: number }|null|undefined} periodPace
 */
export function spendingPaceDisplaySpentRatio(periodPace) {
  if (periodPace?.displaySpentRatio != null) return periodPace.displaySpentRatio;
  return periodPace?.spentRatio ?? 0;
}
