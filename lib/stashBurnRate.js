import { roundMoney } from './finance';
import { C } from '../constants/onboarding-theme';
import {
  getBurnRateColors,
  isMeaningfulBurnValue,
} from './burnRate';

const GOAL_SEGMENT_COLORS = [C.primary, '#7C3AED', '#0891B2', '#059669', '#D97706'];
const TRANSFER_SEGMENT_COLOR = '#64748B';

/**
 * @typedef {Object} StashBurnSegment
 * @property {string} key
 * @property {string} [labelKey]
 * @property {string} [label]
 * @property {number} value
 * @property {string} color
 * @property {string} [goalId]
 */

/**
 * Burn chart for a savings tab — outflows by destination plus what remains in the tab.
 * Total bar = current balance + cumulative outflows (everything that flowed through).
 *
 * @param {{
 *   balance: number,
 *   movements: import('./schema').StashMovement[],
 *   goals?: import('./schema').Goal[],
 * }} input
 */
export function buildStashBurnRate({ balance, movements, goals = [] }) {
  const remaining = roundMoney(Number(balance) || 0);
  const outbound = (movements || []).filter((row) => row.direction === 'out');

  /** @type {Map<string, number>} */
  const goalTotals = new Map();
  let transferOut = 0;

  outbound.forEach((row) => {
    const amt = roundMoney(Number(row.amount) || 0);
    if (amt <= 0) return;

    if (row.type === 'goal_funding' && row.goalId) {
      goalTotals.set(row.goalId, roundMoney((goalTotals.get(row.goalId) || 0) + amt));
      return;
    }

    if (row.type === 'transfer_out' || row.type === 'stash_delete') {
      transferOut = roundMoney(transferOut + amt);
    }
  });

  const goalOutTotal = [...goalTotals.values()].reduce((sum, value) => sum + value, 0);
  const totalOut = roundMoney(goalOutTotal + transferOut);
  const total = roundMoney(remaining + totalOut);

  if (total <= 0) {
    return {
      segments: [],
      total: 0,
      barScale: 1,
      isOvercommitted: false,
      remaining: 0,
      totalOut: 0,
    };
  }

  /** @type {StashBurnSegment[]} */
  const segments = [];
  let colorIndex = 0;

  [...goalTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([goalId, value]) => {
      const goal = goals.find((item) => item.id === goalId);
      segments.push({
        key: `goal:${goalId}`,
        label: goal?.name || goalId,
        value,
        color: GOAL_SEGMENT_COLORS[colorIndex % GOAL_SEGMENT_COLORS.length],
        goalId,
      });
      colorIndex += 1;
    });

  if (transferOut > 0) {
    segments.push({
      key: 'transfer_out',
      labelKey: 'dashboard.savingsScreen.detail.burnRate.transfersOut',
      value: transferOut,
      color: TRANSFER_SEGMENT_COLOR,
    });
  }

  if (remaining > 0 || segments.length === 0) {
    segments.push({
      key: 'remaining',
      labelKey: 'dashboard.savingsScreen.detail.burnRate.remaining',
      value: remaining,
      color: getBurnRateColors().unallocated,
    });
  }

  const visibleSegments = segments.filter((seg) => isMeaningfulBurnValue(seg.value, total));
  const visibleTotal = visibleSegments.reduce((sum, seg) => sum + seg.value, 0);
  const barGap = Math.max(0, total - visibleTotal);
  const barScale = barGap > 0
    && barGap < 1
    && visibleTotal > 0
    && total > 0
    ? total / visibleTotal
    : 1;

  return {
    segments: visibleSegments,
    total,
    barScale,
    isOvercommitted: false,
    remaining,
    totalOut,
  };
}
