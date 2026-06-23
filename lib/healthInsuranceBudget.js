import { parseAlertDate } from './alertDates';
import { toMonthly } from './finance';
import { parseAmount } from './sectionEditStorage';

/** Parse stored or in-form amount strings (e.g. "22500,00") and numbers. */
function parseMoney(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  return parseAmount(String(value)) ?? 0;
}

/**
 * Calendar months from the start of `from`'s month through `end`'s month (inclusive).
 * @param {string} endDateStr - DD/MM/YYYY or MM/YYYY
 * @param {Date} [from=new Date()]
 * @returns {number|null}
 */
export function monthsRemainingUntil(endDateStr, from = new Date()) {
  const end = parseAlertDate(endDateStr);
  if (!end) return null;
  const startMonth = new Date(from.getFullYear(), from.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  if (endMonth < startMonth) return 0;
  const months =
    (endMonth.getFullYear() - startMonth.getFullYear()) * 12
    + (endMonth.getMonth() - startMonth.getMonth())
    + 1;
  return Math.max(1, months);
}

/**
 * Normalized private-insurance contract fields (health member or vehicle).
 * @typedef {Object} InsuranceContractFields
 * @property {number|string|null} [premium]
 * @property {string} [frequency]
 * @property {number|string|null} [customFrequencyMonths]
 * @property {'ongoing'|'fixed'} [endDateType]
 * @property {string} [endDate]
 * @property {boolean} [premiumPaidInFull]
 * @property {'renew'|'switch'|'end'} [renewalPlan]
 * @property {boolean} [budgetForRenewal]
 * @property {boolean} [budgetForSwitch]
 * @property {string} [renewalBudgetMode]
 * @property {number|string|null} [renewalCustomMonthly]
 * @property {number|string|null} [switchPremiumAmount]
 * @property {string} [switchPremiumFrequency]
 * @property {number|string|null} [switchCustomFrequencyMonths]
 */

/**
 * @param {InsuranceContractFields & Record<string, unknown>} contract
 * @returns {boolean}
 */
export function isPrepaidFixedContract(contract) {
  return contract?.endDateType === 'fixed' && contract?.premiumPaidInFull === true;
}

/**
 * Monthly reserve from a lump-sum renewal payment and budget mode.
 * @param {InsuranceContractFields & Record<string, unknown>} contract
 * @param {number|string} lumpPremium
 * @returns {number|null}
 */
export function getPrepaidMonthlyReserve(contract, lumpPremium) {
  const total = parseMoney(lumpPremium);
  if (!total) return null;

  const months = monthsRemainingUntil(contract.endDate);
  if (!months) return null;

  if (contract.renewalBudgetMode === 'custom' && contract.renewalCustomMonthly) {
    const custom = parseMoney(contract.renewalCustomMonthly);
    return custom > 0 ? custom : null;
  }

  if (contract.renewalBudgetMode === 'skip') return null;
  return Math.ceil(total / months);
}

/**
 * Budget line for any prepaid/frequency-based private insurance contract.
 * @param {InsuranceContractFields & Record<string, unknown>} contract
 * @returns {{ amount: number, frequency: string }|null}
 */
export function getInsuranceContractBudgetLine(contract) {
  if (!contract?.premium) return null;

  const premium = parseMoney(contract.premium);
  if (!premium || premium <= 0) return null;

  if (isPrepaidFixedContract(contract)) {
    if (contract.renewalPlan === 'switch' && contract.budgetForSwitch === true && contract.switchPremiumAmount) {
      const monthlyReserve = getPrepaidMonthlyReserve(contract, contract.switchPremiumAmount);
      if (!monthlyReserve) return null;
      return { amount: monthlyReserve, frequency: 'monthly' };
    }

    if (contract.renewalPlan === 'renew' && contract.budgetForRenewal === true) {
      const monthlyReserve = getPrepaidMonthlyReserve(contract, premium);
      if (!monthlyReserve) return null;
      return { amount: monthlyReserve, frequency: 'monthly' };
    }

    return null;
  }

  const freq = contract.frequency || 'monthly';
  if (freq === 'custom' && contract.customFrequencyMonths) {
    const months = parseMoney(contract.customFrequencyMonths);
    if (!months) return null;
    return {
      amount: premium / months,
      frequency: 'monthly',
    };
  }
  return { amount: premium, frequency: freq };
}

/**
 * Map stored vehicle insurance fields to normalized contract shape.
 * @param {Record<string, unknown>} vehicle
 * @returns {InsuranceContractFields}
 */
export function vehicleToInsuranceContract(vehicle) {
  return {
    premium: vehicle.insurancePremium,
    frequency: vehicle.insuranceFrequency,
    customFrequencyMonths: vehicle.insuranceCustomFrequencyMonths,
    endDateType: vehicle.insuranceEndDateType,
    endDate: vehicle.insuranceEndDate,
    premiumPaidInFull: vehicle.insurancePremiumPaidInFull,
    renewalPlan: vehicle.insuranceRenewalPlan,
    budgetForRenewal: vehicle.insuranceBudgetForRenewal,
    budgetForSwitch: vehicle.insuranceBudgetForSwitch,
    renewalBudgetMode: vehicle.insuranceRenewalBudgetMode,
    renewalCustomMonthly: vehicle.insuranceRenewalCustomMonthly,
    switchPremiumAmount: vehicle.insuranceSwitchPremiumAmount,
    switchPremiumFrequency: vehicle.insuranceSwitchPremiumFrequency,
    switchCustomFrequencyMonths: vehicle.insuranceSwitchCustomFrequencyMonths,
  };
}

/**
 * @param {Record<string, unknown>} vehicle
 * @returns {{ amount: number, frequency: string }|null}
 */
export function getVehicleInsuranceBudgetLine(vehicle) {
  if (!vehicle?.insurancePremium || vehicle.hasInsurance === false) return null;
  return getInsuranceContractBudgetLine(vehicleToInsuranceContract(vehicle));
}

/**
 * @param {Record<string, unknown>} vehicle
 * @returns {number}
 */
export function getVehicleInsuranceMonthlyAmount(vehicle) {
  const line = getVehicleInsuranceBudgetLine(vehicle);
  if (!line) return 0;
  return toMonthly(line.amount, line.frequency);
}

/**
 * Suggested monthly reserve for a lump-sum payment due at contract renewal.
 * @param {{ premium?: number|string, endDate?: string, savingsBalance?: number|string, now?: Date }} params
 */
export function computeRenewalSavingsPlan({
  premium,
  endDate,
  savingsBalance = 0,
  now = new Date(),
}) {
  const totalNeeded = parseMoney(premium);
  const monthsRemaining = monthsRemainingUntil(endDate, now);
  if (!monthsRemaining || !totalNeeded) {
    return {
      monthsRemaining: monthsRemaining || 0,
      suggestedMonthly: 0,
      totalNeeded,
      shortfall: Math.max(0, totalNeeded - parseMoney(savingsBalance)),
      isTight: false,
    };
  }
  const suggestedMonthly = Math.ceil(totalNeeded / monthsRemaining);
  const savings = parseMoney(savingsBalance);
  const shortfall = Math.max(0, totalNeeded - savings);
  const isTight = monthsRemaining <= 6 || savings < totalNeeded;
  return {
    monthsRemaining,
    suggestedMonthly,
    totalNeeded,
    shortfall,
    isTight,
  };
}

/**
 * Monthly amount to include in household fixed costs for one health member.
 * @param {import('./schema').HealthInsuranceMember & Record<string, unknown>} member
 * @returns {{ amount: number, frequency: string }|null}
 */
export function getHealthMemberBudgetLine(member) {
  if (!member?.confirmed || member.coverage === 'employer' || !member.premium) {
    return null;
  }

  return getInsuranceContractBudgetLine({
    premium: member.premium,
    frequency: member.frequency,
    customFrequencyMonths: member.customFrequencyMonths,
    endDateType: member.endDateType,
    endDate: member.endDate,
    premiumPaidInFull: member.premiumPaidInFull,
    renewalPlan: member.renewalPlan,
    budgetForRenewal: member.budgetForRenewal,
    budgetForSwitch: member.budgetForSwitch,
    renewalBudgetMode: member.renewalBudgetMode,
    renewalCustomMonthly: member.renewalCustomMonthly,
    switchPremiumAmount: member.switchPremiumAmount,
    switchPremiumFrequency: member.switchPremiumFrequency,
    switchCustomFrequencyMonths: member.switchCustomFrequencyMonths,
  });
}

/**
 * @param {import('./schema').HealthInsuranceMember & Record<string, unknown>} member
 * @returns {number}
 */
export function getHealthMemberMonthlyAmount(member) {
  const line = getHealthMemberBudgetLine(member);
  if (!line) return 0;
  return toMonthly(line.amount, line.frequency);
}
