/** @typedef {'reduceCosts'|'saveMoney'|'reduceAndSave'} GoalType */
/** @typedef {'target'|'ongoing'} SaveMode */
/** @typedef {{ clarity: boolean, spendLess: boolean, buildMore: boolean }} GoalIntents */

export const GOAL_TYPES = {
  REDUCE_COSTS: 'reduceCosts',
  SAVE_MONEY: 'saveMoney',
  REDUCE_AND_SAVE: 'reduceAndSave',
};

export const SAVE_MODES = {
  TARGET: 'target',
  ONGOING: 'ongoing',
};

export const GOAL_INTENTS = {
  CLARITY: 'clarity',
  SPEND_LESS: 'spendLess',
  BUILD_MORE: 'buildMore',
};

/** Default selection for new users on Q5d */
export const DEFAULT_GOAL_INTENTS = {
  clarity: true,
  spendLess: false,
  buildMore: false,
};

/**
 * @param {Partial<GoalIntents>|null|undefined} intents
 * @returns {GoalType|null}
 */
export function deriveGoalTypeFromIntents(intents) {
  const spendLess = Boolean(intents?.spendLess);
  const buildMore = Boolean(intents?.buildMore);
  if (buildMore && spendLess) return GOAL_TYPES.REDUCE_AND_SAVE;
  if (buildMore) return GOAL_TYPES.SAVE_MONEY;
  if (spendLess) return GOAL_TYPES.REDUCE_COSTS;
  return null;
}

/**
 * @param {Partial<GoalIntents>|null|undefined} intents
 * @returns {boolean}
 */
export function goalIntentsIncludeSaving(intents) {
  return Boolean(intents?.buildMore);
}

/**
 * @param {GoalType|null|undefined} goalType
 * @returns {boolean}
 */
export function goalTypeIncludesSaving(goalType) {
  return goalType === GOAL_TYPES.SAVE_MONEY || goalType === GOAL_TYPES.REDUCE_AND_SAVE;
}

/**
 * @param {Partial<GoalIntents>|null|undefined} intents
 * @returns {boolean}
 */
export function hasAnyGoalIntent(intents) {
  return Boolean(intents?.clarity || intents?.spendLess || intents?.buildMore);
}

/**
 * Normalize stored goal intents from income payload.
 * @param {object|null|undefined} inc
 * @returns {GoalIntents}
 */
export function normalizeGoalIntents(inc) {
  if (inc?.goalIntents && typeof inc.goalIntents === 'object') {
    return {
      clarity: inc.goalIntents.clarity !== false,
      spendLess: Boolean(inc.goalIntents.spendLess),
      buildMore: Boolean(inc.goalIntents.buildMore),
    };
  }

  const { goalType } = normalizeIncomeGoalFields(inc);
  if (!goalType) {
    return { ...DEFAULT_GOAL_INTENTS };
  }

  return {
    clarity: false,
    spendLess: goalType === GOAL_TYPES.REDUCE_COSTS || goalType === GOAL_TYPES.REDUCE_AND_SAVE,
    buildMore: goalType === GOAL_TYPES.SAVE_MONEY || goalType === GOAL_TYPES.REDUCE_AND_SAVE,
  };
}

/**
 * @param {object|null|undefined} inc
 * @returns {boolean}
 */
export function hasClarityOnlyFocus(inc) {
  const intents = normalizeGoalIntents(inc);
  return intents.clarity && !deriveGoalTypeFromIntents(intents);
}

/**
 * Map legacy income payloads to goalType/saveMode.
 * @param {object|null|undefined} inc
 * @returns {{ goalType: GoalType|null, saveMode: SaveMode|null }}
 */
export function normalizeIncomeGoalFields(inc) {
  if (!inc) return { goalType: null, saveMode: null };
  if (inc.goalIntents) {
    return {
      goalType: deriveGoalTypeFromIntents(inc.goalIntents),
      saveMode: inc.saveMode || null,
    };
  }
  if (inc.goalType) {
    return { goalType: inc.goalType, saveMode: inc.saveMode || null };
  }
  if (inc.hasGoal && inc.goalAmount) {
    return { goalType: GOAL_TYPES.SAVE_MONEY, saveMode: SAVE_MODES.TARGET };
  }
  if (Number(inc.savingsMonthlyTarget) > 0 && !inc.hasGoal) {
    return { goalType: GOAL_TYPES.SAVE_MONEY, saveMode: SAVE_MODES.ONGOING };
  }
  return { goalType: null, saveMode: null };
}

/**
 * @param {object|null|undefined} inc
 * @returns {boolean}
 */
export function hasFinancialGoal(inc) {
  return Boolean(normalizeIncomeGoalFields(inc).goalType);
}

/**
 * @param {object|null|undefined} inc
 * @returns {boolean}
 */
export function hasGoalFocus(inc) {
  return hasAnyGoalIntent(normalizeGoalIntents(inc));
}

/**
 * @param {object|null|undefined} inc
 * @returns {boolean}
 */
export function hasTargetSavingsGoal(inc) {
  const { goalType, saveMode } = normalizeIncomeGoalFields(inc);
  return goalTypeIncludesSaving(goalType)
    && saveMode === SAVE_MODES.TARGET
    && Number(inc?.goalAmount) > 0
    && Boolean(inc?.goalDate);
}

/**
 * @param {object|null|undefined} inc
 * @returns {boolean}
 */
export function hasOngoingSavingsGoal(inc) {
  const { goalType, saveMode } = normalizeIncomeGoalFields(inc);
  return goalTypeIncludesSaving(goalType)
    && saveMode === SAVE_MODES.ONGOING
    && Number(inc?.savingsMonthlyTarget) > 0;
}

/**
 * Monthly amount to reserve from flexible spending.
 * @param {object|null|undefined} inc
 * @param {{ monthlyRequired?: number }|null|undefined} goalGap
 * @returns {number}
 */
export function getMonthlySavingsReservation(inc, goalGap) {
  const { goalType, saveMode } = normalizeIncomeGoalFields(inc);
  if (!goalTypeIncludesSaving(goalType)) return 0;
  if (saveMode === SAVE_MODES.ONGOING) return Number(inc?.savingsMonthlyTarget) || 0;
  if (saveMode === SAVE_MODES.TARGET) return goalGap?.monthlyRequired || 0;
  return 0;
}

/**
 * @param {object} fields
 * @returns {object}
 */
export function buildIncomeGoalPayload({
  goalIntents,
  goalType: goalTypeOverride,
  saveMode,
  savingsBalance,
  savingsMonthlyTarget,
  goalDescription,
  goalAmount,
  goalDate,
}) {
  const normalizedIntents = {
    clarity: goalIntents?.clarity !== false,
    spendLess: Boolean(goalIntents?.spendLess),
    buildMore: Boolean(goalIntents?.buildMore),
  };
  const goalType = goalTypeOverride ?? deriveGoalTypeFromIntents(normalizedIntents);
  const includesSaving = goalTypeIncludesSaving(goalType);
  const effectiveSaveMode = includesSaving ? saveMode : null;
  const parsedTarget = savingsMonthlyTarget ? parseFloat(savingsMonthlyTarget) : null;
  const parsedAmount = goalAmount ? parseFloat(goalAmount) : null;

  return {
    goalIntents: normalizedIntents,
    goalType: goalType || null,
    saveMode: effectiveSaveMode,
    savingsBalance: savingsBalance ? parseFloat(savingsBalance) : null,
    savingsMonthlyTarget: effectiveSaveMode === SAVE_MODES.ONGOING && parsedTarget
      ? parsedTarget
      : null,
    goalDescription: effectiveSaveMode === SAVE_MODES.TARGET ? (goalDescription || null) : null,
    goalAmount: effectiveSaveMode === SAVE_MODES.TARGET && parsedAmount ? parsedAmount : null,
    goalDate: effectiveSaveMode === SAVE_MODES.TARGET ? (goalDate || null) : null,
    hasGoal: includesSaving && effectiveSaveMode === SAVE_MODES.TARGET && Boolean(parsedAmount),
  };
}

/**
 * @param {object|null|undefined} saved
 * @returns {{ goalIntents: GoalIntents, goalType: GoalType|null, saveMode: SaveMode|null }}
 */
export function restoreGoalSelection(saved) {
  const goalIntents = normalizeGoalIntents(saved);
  const { goalType, saveMode } = normalizeIncomeGoalFields(saved);
  return { goalIntents, goalType, saveMode };
}

/**
 * @param {Partial<GoalIntents>} intents
 * @param {keyof GoalIntents} key
 * @returns {GoalIntents}
 */
export function toggleGoalIntent(intents, key) {
  return { ...intents, [key]: !intents[key] };
}
