import {
  GOAL_TYPES,
  SAVE_MODES,
  DEFAULT_GOAL_INTENTS,
  buildIncomeGoalPayload,
  deriveGoalTypeFromIntents,
  getMonthlySavingsReservation,
  hasClarityOnlyFocus,
  hasTargetSavingsGoal,
  normalizeGoalIntents,
  normalizeIncomeGoalFields,
  restoreGoalSelection,
  toggleGoalIntent,
} from '../../lib/incomeGoals';

describe('deriveGoalTypeFromIntents', () => {
  it('returns null for clarity only', () => {
    expect(deriveGoalTypeFromIntents({ clarity: true, spendLess: false, buildMore: false })).toBeNull();
  });

  it('maps spend less only', () => {
    expect(deriveGoalTypeFromIntents({ clarity: true, spendLess: true, buildMore: false }))
      .toBe(GOAL_TYPES.REDUCE_COSTS);
  });

  it('maps build more only', () => {
    expect(deriveGoalTypeFromIntents({ clarity: false, spendLess: false, buildMore: true }))
      .toBe(GOAL_TYPES.SAVE_MONEY);
  });

  it('maps spend less and build more', () => {
    expect(deriveGoalTypeFromIntents({ clarity: true, spendLess: true, buildMore: true }))
      .toBe(GOAL_TYPES.REDUCE_AND_SAVE);
  });
});

describe('normalizeIncomeGoalFields', () => {
  it('maps legacy target goal', () => {
    expect(normalizeIncomeGoalFields({
      hasGoal: true,
      goalAmount: 250000,
      goalDate: '01/2028',
    })).toEqual({ goalType: GOAL_TYPES.SAVE_MONEY, saveMode: SAVE_MODES.TARGET });
  });

  it('maps legacy ongoing monthly saving', () => {
    expect(normalizeIncomeGoalFields({
      savingsMonthlyTarget: 5000,
      hasGoal: false,
    })).toEqual({ goalType: GOAL_TYPES.SAVE_MONEY, saveMode: SAVE_MODES.ONGOING });
  });

  it('derives goal type from stored intents', () => {
    expect(normalizeIncomeGoalFields({
      goalIntents: { clarity: true, spendLess: true, buildMore: true },
      saveMode: SAVE_MODES.TARGET,
    })).toEqual({ goalType: GOAL_TYPES.REDUCE_AND_SAVE, saveMode: SAVE_MODES.TARGET });
  });
});

describe('normalizeGoalIntents', () => {
  it('defaults to clarity for empty payload', () => {
    expect(normalizeGoalIntents(null)).toEqual(DEFAULT_GOAL_INTENTS);
  });

  it('restores stored intents', () => {
    expect(normalizeGoalIntents({
      goalIntents: { clarity: false, spendLess: true, buildMore: false },
    })).toEqual({ clarity: false, spendLess: true, buildMore: false });
  });

  it('migrates legacy reduce-costs goal', () => {
    expect(normalizeGoalIntents({ goalType: GOAL_TYPES.REDUCE_COSTS })).toEqual({
      clarity: false,
      spendLess: true,
      buildMore: false,
    });
  });
});

describe('buildIncomeGoalPayload', () => {
  it('stores goal intents and derived type', () => {
    const payload = buildIncomeGoalPayload({
      goalIntents: { clarity: true, spendLess: true, buildMore: false },
      saveMode: null,
      savingsBalance: '10000',
      savingsMonthlyTarget: '',
      goalDescription: '',
      goalAmount: '',
      goalDate: '',
    });

    expect(payload.goalIntents).toEqual({ clarity: true, spendLess: true, buildMore: false });
    expect(payload.goalType).toBe(GOAL_TYPES.REDUCE_COSTS);
  });

  it('stores ongoing monthly target only for ongoing mode', () => {
    const payload = buildIncomeGoalPayload({
      goalIntents: { clarity: false, spendLess: false, buildMore: true },
      saveMode: SAVE_MODES.ONGOING,
      savingsBalance: '10000',
      savingsMonthlyTarget: '3000',
      goalDescription: '',
      goalAmount: '',
      goalDate: '',
    });

    expect(payload.savingsMonthlyTarget).toBe(3000);
    expect(payload.goalAmount).toBeNull();
    expect(payload.hasGoal).toBe(false);
  });

  it('clears save fields for clarity-only intents', () => {
    const payload = buildIncomeGoalPayload({
      goalIntents: { clarity: true, spendLess: false, buildMore: false },
      saveMode: SAVE_MODES.TARGET,
      savingsBalance: '10000',
      savingsMonthlyTarget: '3000',
      goalDescription: 'Car',
      goalAmount: '250000',
      goalDate: '01/2028',
    });

    expect(payload.goalType).toBeNull();
    expect(payload.savingsMonthlyTarget).toBeNull();
    expect(payload.goalAmount).toBeNull();
  });
});

describe('getMonthlySavingsReservation', () => {
  it('uses ongoing monthly target', () => {
    expect(getMonthlySavingsReservation({
      goalIntents: { clarity: false, spendLess: false, buildMore: true },
      goalType: GOAL_TYPES.SAVE_MONEY,
      saveMode: SAVE_MODES.ONGOING,
      savingsMonthlyTarget: 4000,
    }, null)).toBe(4000);
  });

  it('uses computed gap for target goals', () => {
    expect(getMonthlySavingsReservation({
      goalIntents: { clarity: false, spendLess: false, buildMore: true },
      goalType: GOAL_TYPES.SAVE_MONEY,
      saveMode: SAVE_MODES.TARGET,
      goalAmount: 100000,
      goalDate: '01/2028',
    }, { monthlyRequired: 8500 })).toBe(8500);
  });
});

describe('restoreGoalSelection', () => {
  it('restores explicit intents from storage', () => {
    expect(restoreGoalSelection({
      goalIntents: { clarity: true, spendLess: false, buildMore: true },
      saveMode: SAVE_MODES.TARGET,
      goalType: GOAL_TYPES.SAVE_MONEY,
    })).toEqual({
      goalIntents: { clarity: true, spendLess: false, buildMore: true },
      goalType: GOAL_TYPES.SAVE_MONEY,
      saveMode: SAVE_MODES.TARGET,
    });
  });
});

describe('hasClarityOnlyFocus', () => {
  it('is true when only clarity is selected', () => {
    expect(hasClarityOnlyFocus({
      goalIntents: { clarity: true, spendLess: false, buildMore: false },
    })).toBe(true);
  });

  it('is false when build more is selected', () => {
    expect(hasClarityOnlyFocus({
      goalIntents: { clarity: true, spendLess: false, buildMore: true },
    })).toBe(false);
  });
});

describe('toggleGoalIntent', () => {
  it('toggles the selected intent', () => {
    expect(toggleGoalIntent(DEFAULT_GOAL_INTENTS, 'clarity')).toEqual({
      clarity: false,
      spendLess: false,
      buildMore: false,
    });
  });
});

describe('hasTargetSavingsGoal', () => {
  it('requires amount and date', () => {
    expect(hasTargetSavingsGoal({
      goalIntents: { clarity: false, spendLess: false, buildMore: true },
      goalType: GOAL_TYPES.SAVE_MONEY,
      saveMode: SAVE_MODES.TARGET,
      goalAmount: 250000,
      goalDate: '06/2028',
    })).toBe(true);
  });
});
