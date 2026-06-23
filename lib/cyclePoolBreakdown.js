import { computeCyclePool } from './cyclePace';
import { getEffectiveCycleJarred, sumUnspentJarredInCycle } from './cycleJar';
import { resolveDailySpendingDestination } from './dailySpendingStrategy';
import { resolveBannerJarFocus } from './jarFocus';

/**
 * @typedef {'entered'|'jarred'|'rollover'|'adjustmentIncome'|'adjustmentExpense'} CyclePoolLineId
 */

/**
 * @typedef {Object} CyclePoolBreakdownLine
 * @property {CyclePoolLineId} id
 * @property {number} amount - Signed delta (negative = reduces pool)
 * @property {string} labelKey
 * @property {string} [route] - Dashboard tab route segment (breakdown rows only; not used for jarred)
 */

/**
 * @typedef {Object} CyclePoolBreakdown
 * @property {number} enteredAmount
 * @property {number} pool
 * @property {number} netDelta
 * @property {CyclePoolBreakdownLine[]} lines
 * @property {boolean} showBanner
 * @property {number} reductionAmount
 * @property {string} bannerReasonKey
 * @property {string} [bannerRoute] - Deep link target for the info banner
 * @property {string|null} [bannerJarId] - Jar id to scroll/highlight on the target tab
 */

/**
 * Explain why active cycle pool differs from entered cycle budget.
 * @param {{
 *   cycle: import('./schema').BudgetCycle,
 *   budget: import('./schema').Budget|null|undefined,
 *   cycleAdjustments?: import('./schema').CycleAdjustment[],
 *   asOfIso?: string,
 * }} params
 * @returns {CyclePoolBreakdown|null}
 */
export function buildCyclePoolBreakdown({
  cycle,
  budget,
  cycleAdjustments = [],
  asOfIso,
}) {
  if (!cycle || cycle.status !== 'active') return null;

  const enteredAmount = Number(cycle.budgetAmount) || 0;
  const { pool, adjustmentIncome, adjustmentExpense } = computeCyclePool(
    cycle,
    budget,
    cycleAdjustments,
    asOfIso,
  );

  const rollover = Number(budget?.rolloverBalance) || 0;
  const poolReduction = getEffectiveCycleJarred(budget, cycle);
  const unspentJarred = sumUnspentJarredInCycle(budget, cycle);
  const dailyDest = resolveDailySpendingDestination(budget);

  /** @type {CyclePoolBreakdownLine[]} */
  const lines = [];

  lines.push({
    id: 'jarred',
    amount: unspentJarred > 0 ? -unspentJarred : 0,
    labelKey: 'dashboard.cycles.pace.breakdown.unspentDailyAllowance',
  });

  if (rollover > 0) {
    lines.push({
      id: 'rollover',
      amount: rollover,
      labelKey: 'dashboard.cycles.pace.breakdown.rollover',
    });
  }

  if (rollover < 0) {
    lines.push({
      id: 'rollover',
      amount: rollover,
      labelKey: 'dashboard.cycles.pace.breakdown.rollover',
    });
  }

  if (adjustmentExpense > 0) {
    lines.push({
      id: 'adjustmentExpense',
      amount: -adjustmentExpense,
      labelKey: 'dashboard.cycles.pace.breakdown.oneOffExpense',
    });
  }

  if (adjustmentIncome > 0) {
    lines.push({
      id: 'adjustmentIncome',
      amount: adjustmentIncome,
      labelKey: 'dashboard.cycles.pace.breakdown.oneOffIncome',
    });
  }

  const netDelta = pool - enteredAmount;
  const reductionAmount = Math.max(0, enteredAmount - pool);
  const showBanner = reductionAmount > 0 && lines.some((l) => l.amount < 0);

  let bannerReasonKey = 'dashboard.cycles.pace.breakdown.bannerGeneric';
  let bannerRoute = 'budget';
  let bannerJarId = null;
  if (unspentJarred > 0 && poolReduction >= reductionAmount) {
    if (dailyDest === 'looseMoney') {
      bannerReasonKey = 'dashboard.cycles.pace.breakdown.bannerPiggyBank';
    } else if (dailyDest === 'savings') {
      bannerReasonKey = 'dashboard.cycles.pace.breakdown.bannerSavings';
    }
    const focus = resolveBannerJarFocus(dailyDest);
    bannerRoute = focus.route;
    bannerJarId = focus.jarId;
  }

  return {
    enteredAmount,
    pool,
    netDelta,
    lines,
    showBanner,
    reductionAmount,
    bannerReasonKey,
    bannerRoute,
    bannerJarId,
  };
}
