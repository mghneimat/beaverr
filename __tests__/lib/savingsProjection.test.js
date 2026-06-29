import {
  buildActualSavingsSeries,
  buildSavingsChartData,
  buildSavingsProjection,
  buildStashHistoricalSeries,
  buildStashHistoryChartData,
  getExpectedYearEndSavings,
  getMonthlyPlannedSavings,
  getSavingsInflowBreakdown,
  hasActualSavingsHistory,
  hasStashHistory,
  hasSavingsMonthEndRolloverHint,
  monthsUntilDate,
} from '../../lib/savingsProjection';

describe('getMonthlyPlannedSavings', () => {
  it('sums budget shift and goal reservation', () => {
    const total = getMonthlyPlannedSavings(
      {
        budgetSavingsShift: 2000,
        deductSavingsGoal: true,
        income: { goalType: 'saveMoney', saveMode: 'ongoing', savingsMonthlyTarget: 3000 },
      },
      { monthlyRequired: 1500 },
    );
    expect(total).toBe(3500);
  });
});

describe('buildSavingsProjection', () => {
  it('projects balance forward using monthly inflow', () => {
    const projection = buildSavingsProjection({
      financials: {
        income: { savingsBalance: 10000 },
        budgetSavingsShift: 2000,
        deductSavingsGoal: false,
      },
      goalGap: null,
      monthsAhead: 3,
      now: new Date(2026, 5, 1),
    });
    expect(projection.points).toHaveLength(4);
    expect(projection.points[3].balance).toBe(16000);
  });

  it('stops at target savings goal amount', () => {
    const goalDate = new Date(2026, 8, 1);
    const projection = buildSavingsProjection({
      financials: {
        income: {
          savingsBalance: 8000,
          goalType: 'saveMoney',
          saveMode: 'target',
          goalAmount: 10000,
          goalDate: `01/09/${goalDate.getFullYear()}`,
        },
        budgetSavingsShift: 2000,
        deductSavingsGoal: false,
      },
      goalGap: { monthlyRequired: 1000 },
      monthsAhead: 12,
      now: new Date(2026, 5, 1),
    });
    const last = projection.points[projection.points.length - 1];
    expect(last.balance).toBe(10000);
    expect(last.atGoal).toBe(true);
    expect(projection.goalReachedMonthIndex).toBe(1);
  });

  it('continues linear growth when ignoreGoals is true', () => {
    const projection = buildSavingsProjection({
      financials: {
        income: {
          savingsBalance: 8000,
          goalType: 'saveMoney',
          saveMode: 'target',
          goalAmount: 10000,
          goalDate: '01/09/2026',
        },
        budgetSavingsShift: 2000,
        deductSavingsGoal: false,
      },
      goalGap: null,
      monthsAhead: 6,
      now: new Date(2026, 5, 1),
      ignoreGoals: true,
    });
    expect(projection.points[6].balance).toBe(20000);
    expect(projection.goalAmount).toBeNull();
    expect(projection.goalReachedMonthIndex).toBeNull();
  });
});

describe('buildActualSavingsSeries', () => {
  it('reconstructs past balance from stash movements', () => {
    const now = new Date(2026, 5, 1);
    const series = buildActualSavingsSeries({
      budget: {
        looseMoneyBalance: 5000,
        stashMovements: [{
          id: 'mv1',
          date: '2026-06-15',
          stashRef: 'looseCash',
          amount: 1000,
          direction: 'in',
          type: 'transfer_in',
        }],
      },
      income: { savingsBalance: 2000 },
      monthsBack: 2,
      now,
    });
    expect(series).toHaveLength(1);
    expect(series[0].balance).toBe(7000);
    expect(series[0].monthDate.getMonth()).toBe(5);
  });

  it('drops leading months before the first stash movement', () => {
    const now = new Date(2026, 5, 1);
    const series = buildActualSavingsSeries({
      budget: {
        looseMoneyBalance: 5000,
        stashMovements: [{
          id: 'mv1',
          date: '2026-03-15',
          stashRef: 'looseCash',
          amount: 2000,
          direction: 'in',
          type: 'transfer_in',
        }],
      },
      income: { savingsBalance: 2000 },
      monthsBack: 5,
      now,
    });
    expect(series[0].monthDate.getMonth()).toBe(2);
    expect(series[series.length - 1].monthDate.getMonth()).toBe(5);
  });
});

describe('buildStashHistoricalSeries', () => {
  it('reconstructs balance for a single stash ref only', () => {
    const now = new Date(2026, 5, 1);
    const series = buildStashHistoricalSeries({
      budget: {
        looseMoneyBalance: 5000,
        stashMovements: [
          {
            id: 'mv1',
            date: '2026-06-15',
            stashRef: 'looseCash',
            amount: 1000,
            direction: 'in',
            type: 'transfer_in',
          },
          {
            id: 'mv2',
            date: '2026-06-10',
            stashRef: 'savings',
            amount: 500,
            direction: 'in',
            type: 'transfer_in',
          },
        ],
      },
      stashRef: 'looseCash',
      currentBalance: 5000,
      monthsBack: 2,
      now,
    });
    expect(series[series.length - 1].balance).toBe(5000);
    expect(series).toHaveLength(1);
    expect(series[0].balance).toBe(5000);
  });
});

describe('hasStashHistory', () => {
  it('is true only when the stash has movements in the chart year', () => {
    expect(hasStashHistory({
      stashMovements: [{
        id: 'mv1',
        date: '2026-04-01',
        stashRef: 'stash:abc',
        amount: 100,
        direction: 'in',
        type: 'transfer_in',
      }],
    }, 'stash:abc', 2026)).toBe(true);
    expect(hasStashHistory({
      stashMovements: [{
        id: 'mv1',
        date: '2026-04-01',
        stashRef: 'looseCash',
        amount: 100,
        direction: 'in',
        type: 'transfer_in',
      }],
    }, 'stash:abc', 2026)).toBe(false);
  });
});

describe('buildStashHistoryChartData', () => {
  it('returns actual points without projected series', () => {
    const now = new Date(2026, 5, 1);
    const chart = buildStashHistoryChartData({
      budget: {
        stashMovements: [{
          id: 'mv1',
          date: '2026-06-01',
          stashRef: 'stash:emergency',
          amount: 500,
          direction: 'in',
          type: 'transfer_in',
        }],
      },
      stashRef: 'stash:emergency',
      currentBalance: 2500,
      now,
    });
    expect(chart.hasActualHistory).toBe(true);
    expect(chart.projectedPoints).toEqual([]);
    expect(chart.actualPoints).toHaveLength(1);
    expect(chart.actualPoints[0].balance).toBe(2500);
  });
});

describe('hasActualSavingsHistory', () => {
  it('is false when stash ledger has no savings-tab movements', () => {
    expect(hasActualSavingsHistory({ stashMovements: [] }, 2026)).toBe(false);
    expect(hasActualSavingsHistory(null, 2026)).toBe(false);
  });

  it('is true when savings-tab movements exist in the chart year', () => {
    expect(hasActualSavingsHistory({
      looseMoneyBalance: 1000,
      stashMovements: [{
        id: 'mv1',
        date: '2026-03-15',
        stashRef: 'looseCash',
        amount: 500,
        direction: 'in',
        type: 'transfer_in',
      }],
    }, 2026)).toBe(true);
  });
});

describe('buildSavingsChartData', () => {
  it('projects chart through year end without capping at savings goal', () => {
    const now = new Date(2026, 5, 1);
    const chart = buildSavingsChartData({
      financials: {
        income: {
          savingsBalance: 8000,
          goalType: 'saveMoney',
          saveMode: 'target',
          goalAmount: 10000,
          goalDate: '01/12/2026',
        },
        budget: { looseMoneyBalance: 0 },
        budgetSavingsShift: 2000,
        deductSavingsGoal: false,
      },
      goalGap: null,
      now,
    });
    expect(chart.hasActualHistory).toBe(false);
    expect(chart.actualPoints).toEqual([]);
    expect(chart.projectedPoints).toHaveLength(7);
    expect(chart.projectedPoints[6].balance).toBe(20000);
    expect(chart.goalAmount).toBeUndefined();
    expect(chart.goalReachedMonthIndex).toBeUndefined();
  });

  it('includes actual series when stash movements exist', () => {
    const now = new Date(2026, 5, 1);
    const chart = buildSavingsChartData({
      financials: {
        income: { savingsBalance: 8000 },
        budget: {
          looseMoneyBalance: 8000,
          stashMovements: [{
            id: 'mv1',
            date: '2026-06-01',
            stashRef: 'looseCash',
            amount: 1000,
            direction: 'in',
            type: 'transfer_in',
          }],
        },
        budgetSavingsShift: 2000,
        deductSavingsGoal: false,
      },
      goalGap: null,
      now,
    });
    expect(chart.hasActualHistory).toBe(true);
    expect(chart.actualPoints).toHaveLength(1);
  });
});

describe('getSavingsInflowBreakdown', () => {
  it('omits month-end rollover rows — those are shown as a banner on Savings', () => {
    const rows = getSavingsInflowBreakdown({
      budgetSavingsShift: 1000,
      deductSavingsGoal: false,
      budget: { rolloverStrategy: 'reset', resetUnspentDestination: 'savings' },
    }, null);
    expect(rows).toEqual([{ key: 'budgetShift', amount: 1000 }]);
  });
});

describe('hasSavingsMonthEndRolloverHint', () => {
  it('is true when reset strategy sends leftovers to savings', () => {
    expect(hasSavingsMonthEndRolloverHint({
      rolloverStrategy: 'reset',
      resetUnspentDestination: 'savings',
    })).toBe(true);
  });

  it('is false for piggy bank or free rollover', () => {
    expect(hasSavingsMonthEndRolloverHint({
      rolloverStrategy: 'reset',
      resetUnspentDestination: 'looseMoney',
    })).toBe(false);
    expect(hasSavingsMonthEndRolloverHint({ rolloverStrategy: 'free' })).toBe(false);
  });
});

describe('getExpectedYearEndSavings', () => {
  it('projects total stash balance to year end using monthly plan', () => {
    const now = new Date(2026, 5, 1);
    const result = getExpectedYearEndSavings({
      financials: {
        income: { savingsBalance: 5000 },
        budget: {},
        budgetSavingsShift: 1000,
        deductSavingsGoal: false,
      },
      goalGap: null,
      now,
    });
    expect(result.year).toBe(2026);
    expect(result.monthlyInflow).toBe(1000);
    expect(result.monthsRemaining).toBe(6);
    expect(result.startBalance).toBe(5000);
    expect(result.expectedBalance).toBe(11000);
  });
});

describe('monthsUntilDate', () => {
  it('returns months between dates', () => {
    const from = new Date(2026, 5, 1);
    const to = new Date(2026, 8, 1);
    expect(monthsUntilDate(to, from)).toBe(3);
  });
});
