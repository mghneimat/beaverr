export const HOUSING_UTILITY_ERROR_KEYS = {
  amount: 'onboarding.housing.rentUtilities.validationAmount',
  customLabel: 'onboarding.housing.rentUtilities.validationCustomName',
};

export const HOUSING_ROW_VALIDATION_KEYS = {
  'ownership-costs': 'onboarding.housing.ownershipCosts.validationDescription',
  'family-housing': 'onboarding.housing.familyHousing.validationDescription',
};


import { computeUtilitiesMonthlyTotal } from '../housingUtilities';
import { estimateAnnualWasteTax, shouldEstimateCzechWasteTax } from '../wasteTax';

/** @typedef {'housing-status'|'rent-details'|'rent-utilities'|'housing-utilities'|'mortgage-status'|'mortgage-details'|'ownership-costs'|'govt-taxes'|'family-housing'} HousingStep */

/**
 * @param {object} ctx
 * @returns {{ type: 'nextStep', step: HousingStep }
 *   | { type: 'utilityFill' }
 *   | { type: 'validateUtilities', errors: Record<string, object>, firstInvalidIdx: number }
 *   | { type: 'validateRows', field: 'description', errors: Record<string, object>, firstInvalidId: string|number }
 *   | { type: 'validationError', key: string }
 *   | { type: 'complete' }}
 */
export function resolveHousingContinue(ctx) {
  const {
    step,
    housingType,
    utilitiesMode,
    utilitiesItemStep,
    utilitySelections,
    rentAmount,
    hasInternet,
    internetAmount,
    hasMortgage,
    mortgageAmount,
    hasOtherCosts,
    otherCostRows,
    contributesToFamily,
    familyContributionRows,
  } = ctx;

  if (step === 'housing-status') {
    if (!housingType) return { type: 'validationError', key: 'onboarding.housing.housingStatus.validation' };
    if (housingType === 'renting') return { type: 'nextStep', step: 'rent-details' };
    if (housingType === 'own') return { type: 'nextStep', step: 'mortgage-status' };
    return { type: 'nextStep', step: 'family-housing' };
  }

  if (step === 'rent-details') {
    if (!rentAmount) return { type: 'validationError', key: 'onboarding.housing.rentDetails.validation' };
    return { type: 'nextStep', step: 'rent-utilities' };
  }

  if (step === 'rent-utilities') {
    if (utilitiesMode === 'total') return { type: 'nextStep', step: 'housing-utilities' };
    if (utilitiesItemStep === 'select') {
      if (utilitySelections.length === 0) return { type: 'nextStep', step: 'housing-utilities' };
      return { type: 'utilityFill' };
    }
    /** @type {Record<string, object>} */
    const nextErrors = {};
    utilitySelections.forEach((item) => {
      if (!item.amount) {
        nextErrors[item.id] = { amount: true };
      } else if (item.key === 'other' && !item.customLabel?.trim()) {
        nextErrors[item.id] = { customLabel: true };
      }
    });
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidIdx = utilitySelections.findIndex((item) => nextErrors[item.id]);
      return {
        type: 'validateUtilities',
        errors: nextErrors,
        firstInvalidIdx: firstInvalidIdx !== -1 ? firstInvalidIdx : 0,
      };
    }
    return { type: 'nextStep', step: 'housing-utilities' };
  }

  if (step === 'housing-utilities') {
    if (hasInternet === true && !internetAmount) {
      return { type: 'validationError', key: 'onboarding.housing.housingUtilities.validation' };
    }
    return { type: 'nextStep', step: 'govt-taxes' };
  }

  if (step === 'mortgage-status') {
    return { type: 'nextStep', step: hasMortgage ? 'mortgage-details' : 'ownership-costs' };
  }

  if (step === 'mortgage-details') {
    if (!mortgageAmount) return { type: 'validationError', key: 'onboarding.housing.mortgageDetails.validation' };
    return { type: 'nextStep', step: 'ownership-costs' };
  }

  if (step === 'ownership-costs') {
    if (hasOtherCosts) {
      /** @type {Record<string, object>} */
      const nextErrors = {};
      otherCostRows.filter((row) => row.visible).forEach((row) => {
        if (!row.description?.trim()) {
          nextErrors[row.id] = { description: true };
        }
      });
      if (Object.keys(nextErrors).length > 0) {
        const firstInvalid = otherCostRows.find((row) => nextErrors[row.id]);
        return {
          type: 'validateRows',
          step,
          field: 'description',
          errors: nextErrors,
          firstInvalidId: firstInvalid?.id ?? 0,
        };
      }
    }
    return { type: 'nextStep', step: 'housing-utilities' };
  }

  if (step === 'family-housing') {
    if (contributesToFamily) {
      /** @type {Record<string, object>} */
      const nextErrors = {};
      familyContributionRows.filter((row) => row.visible).forEach((row) => {
        if (!row.description?.trim()) {
          nextErrors[row.id] = { description: true };
        }
      });
      if (Object.keys(nextErrors).length > 0) {
        const firstInvalid = familyContributionRows.find((row) => nextErrors[row.id]);
        return {
          type: 'validateRows',
          step,
          field: 'description',
          errors: nextErrors,
          firstInvalidId: firstInvalid?.id ?? 0,
        };
      }
    }
    return { type: 'nextStep', step: 'housing-utilities' };
  }

  if (step === 'govt-taxes') return { type: 'complete' };

  return { type: 'complete' };
}

/**
 * @param {object} ctx
 * @returns {{ type: 'setStep', step: HousingStep, restoreUtilitiesFill?: boolean, utilityFillIdx?: number }
 *   | { type: 'utilityBack' }
 *   | { type: 'utilityPrevItem' }
 *   | { type: 'leaveSection' }}
 */
export function resolveHousingBack(ctx) {
  const {
    step,
    housingType,
    utilitiesMode,
    utilitiesItemStep,
    utilitySelections,
    activeUtilityIdx,
    hasMortgage,
  } = ctx;

  if (step === 'rent-details') return { type: 'setStep', step: 'housing-status' };

  if (step === 'rent-utilities') {
    if (utilitiesMode === 'itemized' && utilitiesItemStep === 'fill') {
      if (activeUtilityIdx > 0) return { type: 'utilityPrevItem' };
      return { type: 'utilityBack' };
    }
    return { type: 'setStep', step: 'rent-details' };
  }

  if (step === 'housing-utilities') {
    if (housingType === 'renting') {
      return {
        type: 'setStep',
        step: 'rent-utilities',
        restoreUtilitiesFill: utilitiesMode === 'itemized' && utilitySelections.length > 0,
        utilityFillIdx: Math.max(0, utilitySelections.length - 1),
      };
    }
    if (housingType === 'own') return { type: 'setStep', step: 'ownership-costs' };
    if (housingType === 'family') return { type: 'setStep', step: 'family-housing' };
  }

  if (step === 'mortgage-status') return { type: 'setStep', step: 'housing-status' };
  if (step === 'mortgage-details') return { type: 'setStep', step: 'mortgage-status' };

  if (step === 'ownership-costs') {
    return { type: 'setStep', step: hasMortgage ? 'mortgage-details' : 'mortgage-status' };
  }

  if (step === 'family-housing') return { type: 'setStep', step: 'housing-status' };
  if (step === 'govt-taxes') return { type: 'setStep', step: 'housing-utilities' };

  return { type: 'leaveSection' };
}

/**
 * Build persisted housing payload from form state.
 * @param {object} state
 */
export function buildHousingPayload(state) {
  const {
    housingType,
    rentAmount,
    rentEndDate,
    rentDueDate,
    rentChargeDay,
    utilitiesMode,
    utilitiesAmount,
    utilitiesFrequency,
    utilitySelections,
    hasInternet,
    internetAmount,
    internetFrequency,
    internetEndDate,
    internetDueDate,
    internetChargeDay,
    hasMortgage,
    mortgageAmount,
    mortgageEndDate,
    hasOtherCosts,
    otherCostRows,
    contributesToFamily,
    familyContributionRows,
    wasteTax,
    wasteTaxAmount,
    wasteTaxUserEdited,
    location,
    household,
    tvLicence,
    tvLicenceAmount,
    radioLicence,
    radioLicenceAmount,
    customTaxItems,
  } = state;

  return {
    type: housingType,
    rent: rentAmount ? parseFloat(rentAmount) : null,
    rentEndDate: rentAmount && rentEndDate ? rentEndDate : null,
    rentDueDate: rentAmount && rentDueDate ? rentDueDate : null,
    rentChargeDay: rentAmount && rentChargeDay ? parseInt(rentChargeDay, 10) || null : null,
    utilitiesMode,
    utilities: utilitiesMode === 'total'
      ? (utilitiesAmount ? parseFloat(utilitiesAmount) : null)
      : computeUtilitiesMonthlyTotal(utilitySelections) || null,
    utilitiesFrequency: utilitiesMode === 'total' ? utilitiesFrequency : null,
    utilityItems: utilitiesMode === 'itemized'
      ? utilitySelections.map((item) => ({
        key: item.key,
        category: item.category || null,
        customLabel: item.key === 'other' ? (item.customLabel?.trim() || null) : null,
        amount: item.amount ? parseFloat(item.amount) : null,
        frequency: item.frequency || 'monthly',
      }))
      : [],
    utilityBreakdown: null,
    utilityOtherRows: [],
    hasInternet,
    internetAmount: hasInternet && internetAmount ? parseFloat(internetAmount) : null,
    internetFrequency: hasInternet ? internetFrequency : null,
    internetEndDate: hasInternet && internetEndDate ? internetEndDate : null,
    internetDueDate: hasInternet && internetDueDate ? internetDueDate : null,
    internetChargeDay: hasInternet && internetChargeDay ? parseInt(internetChargeDay, 10) || null : null,
    hasMortgage,
    mortgageAmount: hasMortgage && mortgageAmount ? parseFloat(mortgageAmount) : null,
    mortgageEndDate: hasMortgage ? mortgageEndDate : null,
    hasOtherCosts,
    otherCostRows: hasOtherCosts ? otherCostRows.map((r) => ({
      amount: r.amount ? parseFloat(r.amount) : null,
      description: r.description || null,
      dueDate: r.dueDate || null,
    })) : [],
    contributesToFamily: housingType === 'family' ? contributesToFamily : false,
    familyContributionRows: housingType === 'family' && contributesToFamily === true
      ? familyContributionRows
        .filter((r) => r.visible !== false)
        .map((r) => ({
          amount: r.amount ? parseFloat(r.amount) : null,
          description: r.description || null,
          dueDate: r.dueDate || null,
        }))
      : [],
    govtTaxes: {
      wasteTax,
      wasteTaxAmount: wasteTax ? parseFloat(wasteTaxAmount) : null,
      wasteTaxUserEdited,
      wasteTaxEstimatedAmount: shouldEstimateCzechWasteTax(location)
        ? estimateAnnualWasteTax(household)
        : null,
      tvLicence,
      tvLicenceAmount: tvLicence ? parseFloat(tvLicenceAmount) : null,
      radioLicence,
      radioLicenceAmount: radioLicence ? parseFloat(radioLicenceAmount) : null,
      customItems: customTaxItems.map((item) => ({
        name: item.name,
        amount: item.amount ? parseFloat(item.amount) : null,
        frequency: item.frequency || 'annual',
      })),
    },
  };
}
