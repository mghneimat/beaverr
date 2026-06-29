import { C } from '../constants/onboarding-theme';
import { getBurnRateColors } from './burnRate';

/**
 * Burn chart for pay-cycle counts — how many cycles ended on plan, saved, or in deficit.
 * @param {{
 *   total: number,
 *   asPlanned: number,
 *   savedMoney: number,
 *   deficit: number,
 *   inProgress?: number,
 * }} counts
 */
export function buildCycleCountBurnRate(counts) {
  const colors = getBurnRateColors();
  const total = Math.max(0, Number(counts.total) || 0);
  const asPlanned = Math.max(0, Number(counts.asPlanned) || 0);
  const savedMoney = Math.max(0, Number(counts.savedMoney) || 0);
  const deficit = Math.max(0, Number(counts.deficit) || 0);
  const inProgress = Math.max(0, Number(counts.inProgress) || 0);

  if (total <= 0) {
    return {
      segments: [],
      income: 0,
      barScale: 1,
      isOvercommitted: false,
      total: 0,
      asPlanned,
      savedMoney,
      deficit,
      inProgress,
    };
  }

  /** @type {import('./burnRate').BurnRateSegment[]} */
  const segments = [];

  if (asPlanned > 0) {
    segments.push({
      key: 'asPlanned',
      labelKey: 'dashboard.summaryScreen.cycleOverview.asPlanned',
      value: asPlanned,
      color: colors.committed,
    });
  }

  if (savedMoney > 0) {
    segments.push({
      key: 'saved',
      labelKey: 'dashboard.summaryScreen.cycleOverview.savedMoney',
      value: savedMoney,
      color: colors.saved,
    });
  }

  if (deficit > 0) {
    segments.push({
      key: 'deficit',
      labelKey: 'dashboard.summaryScreen.cycleOverview.deficit',
      value: deficit,
      color: C.danger,
    });
  }

  if (inProgress > 0) {
    segments.push({
      key: 'inProgress',
      labelKey: 'dashboard.summaryScreen.cycleOverview.inProgress',
      value: inProgress,
      color: colors.toSpend,
    });
  }

  const visibleTotal = segments.reduce((sum, seg) => sum + seg.value, 0);
  const barGap = Math.max(0, total - visibleTotal);
  const barScale = barGap > 0 && visibleTotal > 0 ? total / visibleTotal : 1;

  return {
    segments,
    income: total,
    barScale,
    isOvercommitted: false,
    total,
    asPlanned,
    savedMoney,
    deficit,
    inProgress,
  };
}

/** @deprecated Use buildCycleCountBurnRate — kept for test migration */
export function buildCycleBurnRate(counts) {
  return buildCycleCountBurnRate(counts);
}
