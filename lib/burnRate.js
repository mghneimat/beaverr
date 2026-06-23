import { C } from '../constants/onboarding-theme';

/** Ignore bar/legend slices below 1 CZK or 0.05% of income — avoids ghost slivers from float dust. */
export const BURN_SEGMENT_MIN_CZK = 1;
export const BURN_SEGMENT_MIN_SHARE = 0.0005;

function isMeaningfulBurnValue(value, income) {
  if (value <= 0) return false;
  if (value >= BURN_SEGMENT_MIN_CZK) return true;
  return income > 0 && value / income >= BURN_SEGMENT_MIN_SHARE;
}

export { isMeaningfulBurnValue };

/**
 * Burn-rate segment palette — reads active theme at call time.
 */
export function getBurnRateColors() {
  return {
    committed: C.primary,
    saved: C.positive,
    toSpend: C.border,
    unallocated: C.navSelectedBg,
    track: C.progressTrack,
  };
}

/** @deprecated Use getBurnRateColors() — kept for gradual migration */
export const BURN_RATE_COLORS = getBurnRateColors();

/**
 * @typedef {Object} BurnRateSegment
 * @property {string} key
 * @property {string} labelKey
 * @property {number} value
 * @property {string} color
 */

/**
 * Build income-based burn rate: committed + saved + to spend (+ optional unallocated).
 * @param {{ income: number, committed: number, saved: number, showSaved: boolean, toSpend: number }} cascade
 */
export function buildIncomeBurnRate(cascade) {
  const colors = getBurnRateColors();
  const income = Number(cascade.income) || 0;
  const committed = Number(cascade.committed) || 0;
  const saved = cascade.showSaved ? Number(cascade.saved) || 0 : 0;
  const toSpend = Number(cascade.toSpend) || 0;

  /** @type {BurnRateSegment[]} */
  const segments = [
    {
      key: 'committed',
      labelKey: 'dashboard.ledgerCascade.committed',
      value: committed,
      color: colors.committed,
    },
  ];

  if (saved > 0) {
    segments.push({
      key: 'saved',
      labelKey: 'dashboard.ledgerCascade.saved',
      value: saved,
      color: colors.saved,
    });
  }

  if (toSpend > 0) {
    segments.push({
      key: 'toSpend',
      labelKey: 'dashboard.ledgerCascade.toSpend',
      value: toSpend,
      color: colors.toSpend,
    });
  }

  const allocated = committed + saved + toSpend;
  const unallocated = Math.max(0, income - allocated);

  if (isMeaningfulBurnValue(unallocated, income)) {
    segments.push({
      key: 'unallocated',
      labelKey: 'dashboard.ledgerCascade.unallocated',
      value: unallocated,
      color: colors.unallocated,
    });
  }

  const visibleSegments = segments.filter((seg) => isMeaningfulBurnValue(seg.value, income));
  const visibleTotal = visibleSegments.reduce((sum, seg) => sum + seg.value, 0);
  const barGap = Math.max(0, income - visibleTotal);
  const barScale = barGap > 0
    && barGap < BURN_SEGMENT_MIN_CZK
    && visibleTotal > 0
    && income > 0
    ? income / visibleTotal
    : 1;

  return {
    segments: visibleSegments,
    barScale,
    income,
    allocated,
    committedPct: income > 0 ? Math.round((committed / income) * 100) : 0,
    allocatedPct: income > 0 ? Math.round((allocated / income) * 100) : 0,
    isOvercommitted: committed > income,
  };
}

/** @deprecated Use buildIncomeBurnRate — kept for tests migrating off bills/subscriptions split */
export function buildBurnRateSegments(financials) {
  const income = Number(financials.totalIncome) || 0;
  const committed = (Number(financials.fixedCosts) || 0) + (Number(financials.debtPayments) || 0);
  return buildIncomeBurnRate({
    income,
    committed,
    saved: 0,
    showSaved: false,
    toSpend: Number(financials.effectiveMonthlyFlexible ?? financials.monthlyFlexible) || 0,
  });
}
