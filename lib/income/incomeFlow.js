/**
 * Income onboarding step resolution, validation, and navigation.
 */

import {
  getValidOtherIncomeRows,
  hasOtherIncomeMissingLabel,
} from '../otherIncomeCatalog';

/**
 * Resolve the first income sub-step from occupation answers.
 */
export function resolveInitialIncomeStep({
  isEditMode,
  hasPartner,
  userOccupation,
  partnerOccupation,
}) {
  if (isEditMode) return 'yourIncome';

  const userNotWorking = userOccupation === 'notWorking';
  const partnerNotWorking = partnerOccupation === 'notWorking';

  if (hasPartner && userNotWorking && !partnerNotWorking) return 'partnerIncome';
  if (userNotWorking && (!hasPartner || partnerNotWorking)) return 'otherIncome';
  return 'yourIncome';
}

/**
 * @param {object} options
 */
export function resolveIncomeLoadStep({
  isEditMode,
  urlStep,
  savedStep,
  hasPartner,
  userOccupation,
  partnerOccupation,
}) {
  if (urlStep === 'savings') return 'savings';
  if (savedStep) return savedStep;
  return resolveInitialIncomeStep({
    isEditMode,
    hasPartner,
    userOccupation,
    partnerOccupation,
  });
}

export function hasPriorSalaryIncome({
  isNotWorking,
  incomeAmount,
  hasPartner,
  partnerIsNotWorking,
  partnerIncomeAmount,
}) {
  const userIncome = !isNotWorking && parseFloat(incomeAmount) > 0;
  const partnerIncome = hasPartner && !partnerIsNotWorking && parseFloat(partnerIncomeAmount) > 0;
  return userIncome || partnerIncome;
}

export function validateOtherIncomeContinue({
  hasPriorSalary,
  otherIncomeRows,
  phase = 'fill',
}) {
  const activeRows = (otherIncomeRows || []).filter((row) => row.visible !== false);
  const hasSelections = activeRows.length > 0;

  if (phase === 'select') {
    if (!hasPriorSalary && !hasSelections) return 'validationNoIncome';
    return null;
  }

  if (!hasPriorSalary && !hasSelections) return 'validationNoIncome';
  if (hasPriorSalary && !hasSelections) return null;

  if (hasOtherIncomeMissingLabel(otherIncomeRows)) return 'validationOtherLabel';
  if (getValidOtherIncomeRows(otherIncomeRows).length === 0) return 'validationOtherAmount';
  return null;
}

export function getIncomeBackTarget({
  step,
  hasPartner,
  isNotWorking,
  partnerIsNotWorking,
}) {
  const skippedToPartner = hasPartner && isNotWorking && !partnerIsNotWorking;
  const skippedToOther = isNotWorking && (!hasPartner || partnerIsNotWorking);

  if (step === 'partnerIncome') {
    return skippedToPartner ? 'splash' : 'yourIncome';
  }
  if (step === 'otherIncome') {
    if (skippedToPartner) return 'partnerIncome';
    if (skippedToOther) return 'splash';
    if (hasPartner && !partnerIsNotWorking) return 'partnerIncome';
    return 'yourIncome';
  }
  return 'splash';
}

/**
 * @param {object} ctx
 * @returns {{ type: 'nextStep', step: string }
 *   | { type: 'otherIncomeFill' }
 *   | { type: 'validationError', validationKey: string, partnerName?: string }
 *   | { type: 'otherIncomeErrors', validationKey: string, errors: Record<string, object>, firstInvalidIdx: number, partnerName?: string }
 *   | { type: 'complete' }}
 */
export function resolveIncomeContinue(ctx) {
  const {
    step,
    isNotWorking,
    incomeAmount,
    hasPartner,
    partnerIsNotWorking,
    partnerIncomeAmount,
    partnerName,
    otherIncomeStep,
    otherIncomeRows,
  } = ctx;

  if (step === 'yourIncome') {
    if (!isNotWorking && !incomeAmount) {
      return { type: 'validationError', validationKey: 'onboarding.income.yourIncome.validation' };
    }
    return {
      type: 'nextStep',
      step: hasPartner && !partnerIsNotWorking ? 'partnerIncome' : 'otherIncome',
    };
  }

  if (step === 'partnerIncome') {
    if (!partnerIncomeAmount) {
      return {
        type: 'validationError',
        validationKey: 'onboarding.income.partnerIncome.validation',
        partnerName,
      };
    }
    return { type: 'nextStep', step: 'otherIncome' };
  }

  if (step === 'otherIncome') {
    const priorSalary = hasPriorSalaryIncome({
      isNotWorking,
      incomeAmount,
      hasPartner,
      partnerIsNotWorking,
      partnerIncomeAmount,
    });

    const validationKey = validateOtherIncomeContinue({
      hasPriorSalary: priorSalary,
      otherIncomeRows,
      phase: otherIncomeStep,
    });

    if (otherIncomeStep === 'select') {
      if (validationKey) {
        const base = validationKey === 'validationNoIncome' && !hasPartner
          ? 'onboarding.income.otherIncome.validationNoIncomeSolo'
          : `onboarding.income.otherIncome.${validationKey}`;
        return { type: 'validationError', validationKey: base, partnerName };
      }
      if (otherIncomeRows.length === 0) return { type: 'nextStep', step: 'savings' };
      return { type: 'otherIncomeFill' };
    }

    if (validationKey) {
      /** @type {Record<string, object>} */
      const nextErrors = {};
      otherIncomeRows.forEach((row) => {
        if (!row.amount || parseFloat(row.amount) <= 0) nextErrors[row.id] = { amount: true };
        else if (row.sourceKey === 'other' && !row.customLabel?.trim()) {
          nextErrors[row.id] = { customLabel: true };
        }
      });
      const firstInvalidIdx = otherIncomeRows.findIndex((row) => nextErrors[row.id]);
      const base = validationKey === 'validationNoIncome' && !hasPartner
        ? 'onboarding.income.otherIncome.validationNoIncomeSolo'
        : `onboarding.income.otherIncome.${validationKey}`;
      return {
        type: 'otherIncomeErrors',
        validationKey: base,
        errors: nextErrors,
        firstInvalidIdx: firstInvalidIdx !== -1 ? firstInvalidIdx : 0,
        partnerName,
      };
    }
    return { type: 'nextStep', step: 'savings' };
  }

  if (step === 'savings') return { type: 'complete' };

  return { type: 'complete' };
}

export function getOccupationTitleKey(occupationKey) {
  switch (occupationKey) {
    case 'employee': return 'titleEmployee';
    case 'selfEmployed': return 'titleSelfEmployed';
    case 'student': return 'titleStudent';
    case 'notWorking': return 'titleNotWorking';
    default: return 'titleOther';
  }
}

export function getOccupationHelperKey(occupationKey) {
  switch (occupationKey) {
    case 'employee': return 'helperEmployee';
    case 'selfEmployed': return 'helperSelfEmployed';
    case 'student': return 'helperStudent';
    case 'notWorking': return 'helperNotWorking';
    default: return 'helperOther';
  }
}
