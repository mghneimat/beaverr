import { asArray } from './asArray';
import { childCostDisplayName } from './childrenCostsCatalog';
import { VEHICLE_CATEGORIES, getVehicleDisplayLabel } from './transport/transportFlow';
import { getSinkingHealthInsuranceName } from './healthMembers';
import { subscriptionDisplayName } from './subscriptionCatalog';
import {
  computeRenewalSavingsPlan,
  getPrepaidMonthlyReserve,
  isPrepaidFixedContract,
  monthsRemainingUntil,
  vehicleToInsuranceContract,
} from './healthInsuranceBudget';
import { parseAmount } from './sectionEditStorage';
import { roundMoney } from './finance';
import {
  retireOrphanAutoSinkingStashes,
  upsertAutoSinkingStash,
} from './customStashes';

/** @typedef {import('./schema').Budget} Budget */

/**
 * @typedef {Object} SinkingFundCandidate
 * @property {string} sourceKey
 * @property {string} name
 * @property {string|null} [description]
 * @property {number} targetAmount
 * @property {string} dueDate - DD/MM/YYYY
 * @property {number} suggestedMonthly
 */

const SINKING_FREQUENCIES = new Set(['annual', 'quarterly']);
const VIGNETTE_CATEGORIES = new Set(['passenger', 'motorcycle']);

/**
 * @param {number|string|null|undefined} value
 * @returns {number}
 */
function parseMoney(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  return parseAmount(String(value)) ?? 0;
}

/**
 * @param {string|null|undefined} primary
 * @param {string|null|undefined} [fallback]
 * @returns {string|null}
 */
function resolveDueDate(primary, fallback) {
  const date = (primary || fallback || '').trim();
  return date || null;
}

/**
 * @param {number} targetAmount
 * @param {string} dueDate
 * @param {Date} now
 * @returns {number|null}
 */
function suggestedMonthlyForLump(targetAmount, dueDate, now) {
  const months = monthsRemainingUntil(dueDate, now);
  if (!months || targetAmount <= 0) return null;
  return Math.ceil(targetAmount / months);
}

/**
 * @param {import('./healthInsuranceBudget').InsuranceContractFields & Record<string, unknown>} contract
 * @param {Date} now
 * @returns {{ targetAmount: number, suggestedMonthly: number }|null}
 */
function resolvePrepaidInsuranceAmounts(contract, now) {
  if (!isPrepaidFixedContract(contract)) return null;
  if (contract.renewalPlan === 'end') return null;

  let targetAmount = 0;
  if (contract.renewalPlan === 'switch' && contract.switchPremiumAmount) {
    targetAmount = parseMoney(contract.switchPremiumAmount);
  } else if (contract.renewalPlan === 'renew' || !contract.renewalPlan) {
    targetAmount = parseMoney(contract.premium);
  } else {
    targetAmount = parseMoney(contract.premium);
  }

  if (targetAmount <= 0) return null;

  const reserve = getPrepaidMonthlyReserve(contract, targetAmount);
  const plan = computeRenewalSavingsPlan({
    premium: targetAmount,
    endDate: contract.endDate,
    now,
  });

  return {
    targetAmount,
    suggestedMonthly: reserve ?? plan.suggestedMonthly ?? 0,
  };
}

/**
 * @param {Record<string, unknown>} contract
 * @param {{
 *   sourceKey: string,
 *   name: string,
 *   t: (key: string, params?: Record<string, string|number>) => string,
 *   formatCurrency: (amount: number) => string,
 *   now: Date,
 * }} ctx
 * @returns {SinkingFundCandidate|null}
 */
function candidateFromPrepaidInsurance(contract, ctx) {
  const dueDate = resolveDueDate(contract.endDate);
  const amounts = resolvePrepaidInsuranceAmounts(contract, ctx.now);
  if (!amounts || !dueDate) return null;

  const { targetAmount, suggestedMonthly } = amounts;
  if (suggestedMonthly <= 0) return null;

  return {
    sourceKey: ctx.sourceKey,
    name: ctx.name,
    description: ctx.t('dashboard.savingsScreen.sinkingFund.helper', {
      target: ctx.formatCurrency(targetAmount),
      due: dueDate,
      monthly: ctx.formatCurrency(suggestedMonthly),
    }),
    targetAmount,
    dueDate,
    suggestedMonthly,
  };
}

/**
 * @param {Record<string, unknown>} vehicle
 * @param {number} index
 * @param {(key: string, params?: Record<string, string|number>) => string} t
 * @param {(amount: number) => string} formatCurrency
 * @param {Date} now
 * @returns {SinkingFundCandidate[]}
 */
function collectVehicleCandidates(vehicle, index, t, formatCurrency, now) {
  /** @type {SinkingFundCandidate[]} */
  const out = [];
  const vehicleId = vehicle.id || `vehicle_${index}`;
  const vehicleLabel = getVehicleDisplayLabel(vehicle, index, t);

  if (vehicle.hasInsurance !== false && vehicle.insurancePremium) {
    const contract = vehicleToInsuranceContract(vehicle);
    const candidate = candidateFromPrepaidInsurance(contract, {
      sourceKey: `vehicle_insurance:${vehicleId}`,
      name: t('dashboard.savingsScreen.sinkingFund.vehicleInsurance', { vehicle: vehicleLabel }),
      t,
      formatCurrency,
      now,
    });
    if (candidate) out.push(candidate);
  }

  const motCost = parseMoney(vehicle.motInspectionCost);
  const motDue = resolveDueDate(vehicle.motNextDate, vehicle.motDate);
  if (motCost > 0 && motDue) {
    const suggestedMonthly = suggestedMonthlyForLump(motCost, motDue, now);
    if (suggestedMonthly) {
      out.push({
        sourceKey: `vehicle_mot:${vehicleId}`,
        name: t('dashboard.savingsScreen.sinkingFund.vehicleMot', { vehicle: vehicleLabel }),
        description: t('dashboard.savingsScreen.sinkingFund.helper', {
          target: formatCurrency(motCost),
          due: motDue,
          monthly: formatCurrency(suggestedMonthly),
        }),
        targetAmount: motCost,
        dueDate: motDue,
        suggestedMonthly,
      });
    }
  }

  if (vehicle.hasParking && vehicle.parkingFrequency === 'annual') {
    const parkingCost = parseMoney(vehicle.parkingAmount);
    const parkingDue = resolveDueDate(vehicle.parkingEndDate, vehicle.parkingDueDate);
    if (parkingCost > 0 && parkingDue) {
      const suggestedMonthly = suggestedMonthlyForLump(parkingCost, parkingDue, now);
      if (suggestedMonthly) {
        out.push({
          sourceKey: `vehicle_parking:${vehicleId}`,
          name: t('dashboard.savingsScreen.sinkingFund.vehicleParking', { vehicle: vehicleLabel }),
          description: t('dashboard.savingsScreen.sinkingFund.helper', {
            target: formatCurrency(parkingCost),
            due: parkingDue,
            monthly: formatCurrency(suggestedMonthly),
          }),
          targetAmount: parkingCost,
          dueDate: parkingDue,
          suggestedMonthly,
        });
      }
    }
  }

  if (VIGNETTE_CATEGORIES.has(vehicle.category) && vehicle.hasVignette === true) {
    const vignetteCost = parseMoney(vehicle.vignetteAmount);
    const vignetteDue = resolveDueDate(vehicle.vignetteValidUntil);
    if (vignetteCost > 0 && vignetteDue) {
      const suggestedMonthly = suggestedMonthlyForLump(vignetteCost, vignetteDue, now);
      if (suggestedMonthly) {
        out.push({
          sourceKey: `vehicle_vignette:${vehicleId}`,
          name: t('dashboard.savingsScreen.sinkingFund.vehicleVignette', { vehicle: vehicleLabel }),
          description: t('dashboard.savingsScreen.sinkingFund.helper', {
            target: formatCurrency(vignetteCost),
            due: vignetteDue,
            monthly: formatCurrency(suggestedMonthly),
          }),
          targetAmount: vignetteCost,
          dueDate: vignetteDue,
          suggestedMonthly,
        });
      }
    }
  }

  asArray(vehicle.maintenanceItems).forEach((item, itemIndex) => {
    const cost = parseMoney(item.cost);
    const due = resolveDueDate(item.date);
    if (cost <= 0 || !due) return;
    const suggestedMonthly = suggestedMonthlyForLump(cost, due, now);
    if (!suggestedMonthly) return;
    out.push({
      sourceKey: `vehicle_maintenance:${vehicleId}:${itemIndex}`,
      name: t('dashboard.savingsScreen.sinkingFund.vehicleMaintenance', {
        vehicle: vehicleLabel,
        item: item.description?.trim() || t('dashboard.savingsScreen.sinkingFund.maintenanceFallback'),
      }),
      description: t('dashboard.savingsScreen.sinkingFund.helper', {
        target: formatCurrency(cost),
        due,
        monthly: formatCurrency(suggestedMonthly),
      }),
      targetAmount: cost,
      dueDate: due,
      suggestedMonthly,
    });
  });

  return out;
}

/**
 * @param {string} key
 * @param {Record<string, unknown>} sections
 * @param {(key: string, params?: Record<string, string|number>) => string} t
 * @returns {string}
 */
function resolveSinkingPermitHolder(key, sections, t) {
  const household = sections.household || {};
  if (key === 'user') return t('dashboard.savingsScreen.sinkingFund.holderUser');
  if (key === 'partner') {
    const name = household.partnerName?.trim();
    return name || t('dashboard.savingsScreen.sinkingFund.holderPartner');
  }
  if (key.startsWith('child_')) {
    const index = Number(key.replace('child_', ''));
    const child = household.children?.[index];
    return child?.displayName?.trim()
      || t('dashboard.savingsScreen.sinkingFund.holderChild', { index: index + 1 });
  }
  return key;
}

/**
 * @param {Record<string, unknown>} sections
 * @param {(key: string, params?: Record<string, string|number>) => string} t
 * @param {(amount: number) => string} formatCurrency
 * @param {Date} [now]
 * @returns {SinkingFundCandidate[]}
 */
export function buildSinkingFundCandidates(sections, t, formatCurrency, now = new Date()) {
  /** @type {SinkingFundCandidate[]} */
  const candidates = [];
  const yearEnd = `31/12/${now.getFullYear()}`;

  const health = sections.health || {};
  Object.entries(health).forEach(([memberKey, member]) => {
    if (!member || member.skipped || member.coverage === 'employer') return;
    const candidate = candidateFromPrepaidInsurance(member, {
      sourceKey: `health_insurance:${memberKey}`,
      name: getSinkingHealthInsuranceName(memberKey, sections.household, t),
      t,
      formatCurrency,
      now,
    });
    if (candidate) candidates.push(candidate);
  });

  const transport = sections.transport || {};
  asArray(transport.vehicles).forEach((vehicle, index) => {
    candidates.push(...collectVehicleCandidates(vehicle, index, t, formatCurrency, now));
  });

  asArray(sections.pets).forEach((pet, index) => {
    if (!pet?.hasInsurance || !pet.insurancePremium) return;
    const frequency = pet.insuranceFrequency || 'annual';
    if (!SINKING_FREQUENCIES.has(frequency)) return;
    const targetAmount = parseMoney(pet.insurancePremium);
    const dueDate = resolveDueDate(pet.insuranceRenewalDate);
    if (targetAmount <= 0 || !dueDate) return;
    const suggestedMonthly = suggestedMonthlyForLump(targetAmount, dueDate, now);
    if (!suggestedMonthly) return;
    const petName = pet.name?.trim() || t('dashboard.savingsScreen.sinkingFund.petFallback', { index: index + 1 });
    candidates.push({
      sourceKey: `pet_insurance:${pet.id || index}`,
      name: t('dashboard.savingsScreen.sinkingFund.petInsurance', { pet: petName }),
      description: t('dashboard.savingsScreen.sinkingFund.helper', {
        target: formatCurrency(targetAmount),
        due: dueDate,
        monthly: formatCurrency(suggestedMonthly),
      }),
      targetAmount,
      dueDate,
      suggestedMonthly,
    });
  });

  asArray(sections.subs).forEach((sub) => {
    const frequency = sub.frequency || 'monthly';
    if (!SINKING_FREQUENCIES.has(frequency)) return;
    const targetAmount = parseMoney(sub.cost);
    const dueDate = resolveDueDate(sub.endDate, sub.renewalDate || sub.dueDate);
    if (targetAmount <= 0 || !dueDate) return;
    const suggestedMonthly = suggestedMonthlyForLump(targetAmount, dueDate, now);
    if (!suggestedMonthly) return;
    candidates.push({
      sourceKey: `subscription:${sub.id}`,
      name: t('dashboard.savingsScreen.sinkingFund.subscription', {
        service: subscriptionDisplayName(sub, t),
      }),
      description: t('dashboard.savingsScreen.sinkingFund.helper', {
        target: formatCurrency(targetAmount),
        due: dueDate,
        monthly: formatCurrency(suggestedMonthly),
      }),
      targetAmount,
      dueDate,
      suggestedMonthly,
    });
  });

  const location = sections.location || {};
  /** @param {string} key @param {object} permit */
  const pushPermit = (key, permit) => {
    if (!permit?.endDate) return;
    const targetAmount = parseMoney(permit.renewalCost);
    if (targetAmount <= 0) return;
    const dueDate = permit.endDate;
    const suggestedMonthly = suggestedMonthlyForLump(targetAmount, dueDate, now);
    if (!suggestedMonthly) return;
    candidates.push({
      sourceKey: `residence_permit:${key}`,
      name: t('dashboard.savingsScreen.sinkingFund.residencePermit', {
        holder: resolveSinkingPermitHolder(key, sections, t),
        renewal: t('dashboard.savingsScreen.sinkingFund.residencePermitRenewal'),
      }),
      description: t('dashboard.savingsScreen.sinkingFund.helper', {
        target: formatCurrency(targetAmount),
        due: dueDate,
        monthly: formatCurrency(suggestedMonthly),
      }),
      targetAmount,
      dueDate,
      suggestedMonthly,
    });
  };

  if (location.isCzCitizen === false && location.residencePermit) {
    pushPermit('user', location.residencePermit);
  }
  if (location.partnerIsCzCitizen === false && location.partnerResidencePermit) {
    pushPermit('partner', location.partnerResidencePermit);
  }
  asArray(location.childrenCitizenship).forEach((entry, index) => {
    if (entry?.isCzCitizen !== false || !entry?.residencePermit) return;
    pushPermit(`child_${index}`, entry.residencePermit);
  });

  const housing = sections.housing || {};
  const gt = housing.govtTaxes || {};
  /** @param {string} key @param {number} amount @param {string} label */
  const pushAnnualTax = (key, amount, label) => {
    const targetAmount = parseMoney(amount);
    if (targetAmount <= 0) return;
    const suggestedMonthly = suggestedMonthlyForLump(targetAmount, yearEnd, now);
    if (!suggestedMonthly) return;
    candidates.push({
      sourceKey: `govt_tax:${key}`,
      name: label,
      description: t('dashboard.savingsScreen.sinkingFund.helper', {
        target: formatCurrency(targetAmount),
        due: yearEnd,
        monthly: formatCurrency(suggestedMonthly),
      }),
      targetAmount,
      dueDate: yearEnd,
      suggestedMonthly,
    });
  };

  if (gt.wasteTax) pushAnnualTax('waste', gt.wasteTaxAmount, t('dashboard.savingsScreen.sinkingFund.wasteTax'));
  if (gt.tvLicence) pushAnnualTax('tv', gt.tvLicenceAmount, t('dashboard.savingsScreen.sinkingFund.tvLicence'));
  if (gt.radioLicence) pushAnnualTax('radio', gt.radioLicenceAmount, t('dashboard.savingsScreen.sinkingFund.radioLicence'));
  asArray(gt.customItems).forEach((item, index) => {
    if ((item.frequency || 'annual') !== 'annual') return;
    pushAnnualTax(
      `custom_${index}`,
      item.amount,
      item.label?.trim() || t('dashboard.savingsScreen.sinkingFund.customTax', { index: index + 1 }),
    );
  });

  asArray(housing.otherCostRows).forEach((row, index) => {
    const targetAmount = parseMoney(row.amount);
    const dueDate = resolveDueDate(row.dueDate);
    if (targetAmount <= 0 || !dueDate) return;
    const suggestedMonthly = suggestedMonthlyForLump(targetAmount, dueDate, now);
    if (!suggestedMonthly) return;
    candidates.push({
      sourceKey: `housing_other:${row.id || index}`,
      name: row.description?.trim() || t('dashboard.savingsScreen.sinkingFund.housingOther', { index: index + 1 }),
      description: t('dashboard.savingsScreen.sinkingFund.helper', {
        target: formatCurrency(targetAmount),
        due: dueDate,
        monthly: formatCurrency(suggestedMonthly),
      }),
      targetAmount,
      dueDate,
      suggestedMonthly,
    });
  });

  const childrenCosts = sections.childrenCosts || {};
  Object.entries(childrenCosts).forEach(([childKey, fields]) => {
    if (!fields || typeof fields !== 'object') return;
    const childIndex = Number(String(childKey).replace('child_', '')) || 0;
    const child = sections.household?.children?.[childIndex];
    const childName = child?.displayName?.trim()
      || t('dashboard.savingsScreen.sinkingFund.holderChild', { index: childIndex + 1 });

    Object.entries(fields).forEach(([fieldKey, field]) => {
      if (!field || typeof field !== 'object') return;
      const frequency = field.frequency || 'monthly';
      if (!SINKING_FREQUENCIES.has(frequency)) return;
      const targetAmount = parseMoney(field.amount);
      const dueDate = resolveDueDate(field.endDate, field.dueDate);
      if (targetAmount <= 0 || !dueDate) return;
      const suggestedMonthly = suggestedMonthlyForLump(targetAmount, dueDate, now);
      if (!suggestedMonthly) return;
      const costLabel = childCostDisplayName(fieldKey, field.customLabel, t);
      candidates.push({
        sourceKey: `child_cost:${childKey}:${fieldKey}`,
        name: t('dashboard.savingsScreen.sinkingFund.childCost', {
          child: childName,
          cost: costLabel,
        }),
        description: t('dashboard.savingsScreen.sinkingFund.helper', {
          target: formatCurrency(targetAmount),
          due: dueDate,
          monthly: formatCurrency(suggestedMonthly),
        }),
        targetAmount,
        dueDate,
        suggestedMonthly,
      });
    });
  });

  return candidates;
}

/**
 * Sync auto sinking-fund stashes from household sections.
 * @param {Budget|null|undefined} budget
 * @param {Record<string, unknown>} sections
 * @param {(key: string, params?: Record<string, string|number>) => string} t
 * @param {(amount: number) => string} formatCurrency
 * @param {Date} [now]
 * @returns {{ budget: Budget, changed: boolean, created: number, updated: number }}
 */
export function syncSinkingFundStashes(budget, sections, t, formatCurrency, now = new Date()) {
  const candidates = buildSinkingFundCandidates(sections, t, formatCurrency, now);
  const activeKeys = new Set(candidates.map((c) => c.sourceKey));

  let nextBudget = budget && typeof budget === 'object' ? { ...budget } : {};
  let changed = false;
  let created = 0;
  let updated = 0;

  candidates.forEach((candidate) => {
    const result = upsertAutoSinkingStash(nextBudget, {
      ...candidate,
      targetAmount: roundMoney(candidate.targetAmount),
      suggestedMonthly: roundMoney(candidate.suggestedMonthly),
    }, now);
    if (result.changed) {
      nextBudget = result.budget;
      changed = true;
      if (result.created) created += 1;
      else updated += 1;
    }
  });

  const retired = retireOrphanAutoSinkingStashes(nextBudget, activeKeys);
  if (retired.changed) {
    nextBudget = retired.budget;
    changed = true;
  }

  return { budget: nextBudget, changed, created, updated };
}

export { VIGNETTE_CATEGORIES, VEHICLE_CATEGORIES };
