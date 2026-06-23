/**
 * Transport onboarding step graph and vehicle helpers.
 */

export const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid', 'lpg', 'cng'];
export const PARKING_FREQUENCIES = ['monthly', 'annual'];
export const VEHICLE_CATEGORIES = ['passenger', 'motorcycle', 'bicycle'];

export const CATEGORY_LABELS = {
  passenger: 'onboarding.transport.vehicleCounts.passenger',
  motorcycle: 'onboarding.transport.vehicleCounts.motorcycle',
  bicycle: 'onboarding.transport.vehicleCounts.bicycle',
};

/** Passenger cars require mandatory liability insurance (e.g. CZ povinné ručení). */
export function isMandatoryVehicleInsurance(category) {
  return category === 'passenger';
}

export function vehicleRequiresInsurance(vehicle) {
  return isMandatoryVehicleInsurance(vehicle?.category) || vehicle?.hasInsurance === true;
}

export function createMaintenanceItem() {
  return {
    id: `maint_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    description: '',
    cost: '',
    date: '',
    visible: true,
  };
}

/** @param {object[]} [items] */
export function withMaintenanceIds(items, vehicleKey = '0') {
  return (items || []).map((item, index) => ({
    ...item,
    id: item.id || `maint_${vehicleKey}_${index}`,
    visible: item.visible !== false,
  }));
}

/** @param {object[]} [items] */
export function serializeMaintenanceItems(items) {
  return (items || [])
    .filter((item) => item.visible !== false)
    .map(({ description, cost, date }) => ({
      description: description || '',
      cost: cost !== '' && cost != null ? parseFloat(cost) || 0 : '',
      date: date || '',
    }));
}

/** Create a fresh vehicle object for a given category */
export function createVehicle(category, index) {
  return {
    id: `v_${Date.now()}_${index}`,
    category,
    fuelType: null,
    fuelCost: '',
    hasInsurance: isMandatoryVehicleInsurance(category),
    insurancePremium: '',
    insuranceFrequency: 'annual',
    insuranceCustomFrequencyMonths: '',
    insuranceStartDate: '',
    insuranceRenewalDate: '',
    insuranceEndDateType: 'ongoing',
    insuranceEndDate: '',
    insurancePremiumPaidInFull: undefined,
    insuranceRenewalPlan: undefined,
    insuranceBudgetForRenewal: undefined,
    insuranceRenewalBudgetMode: 'suggested',
    insuranceRenewalCustomMonthly: '',
    insuranceBudgetForSwitch: undefined,
    insuranceSwitchPremiumAmount: '',
    insuranceSwitchPremiumFrequency: 'monthly',
    insuranceSwitchCustomFrequencyMonths: '',
    insuranceCoverageType: null,
    insuranceLiabilityAmount: '',
    hasParking: false,
    parkingAmount: '',
    parkingFrequency: 'annual',
    motDate: '',
    motInspectionCost: '',
    motNextDate: '',
    hasPlannedMaintenance: false,
    maintenanceItems: [],
  };
}

/** Build the vehicles array from counter values */
export function buildVehiclesFromCounts(counts) {
  const vehicles = [];
  let idx = 0;
  VEHICLE_CATEGORIES.forEach((cat) => {
    for (let i = 0; i < (counts[cat] || 0); i += 1) {
      vehicles.push(createVehicle(cat, idx));
      idx += 1;
    }
  });
  return vehicles;
}

/** Get a human-readable category label key for the sub-header */
export function getCategoryLabelKey(category) {
  return CATEGORY_LABELS[category] || category;
}

/** @typedef {'vehicle-ownership'|'vehicle-counts'|'vehicle-fuel'|'vehicle-insurance'|'vehicle-maintenance'|'vehicle-summary'|'public-transport'} TransportStep */

/**
 * @param {object} ctx
 * @returns {{ type: 'nextStep', step: TransportStep, vehicleIndex?: number, vehicles?: object[] }
 *   | { type: 'validationError', key: string }
 *   | { type: 'complete' }}
 */
export function resolveTransportContinue(ctx) {
  const {
    step,
    hasVehicle,
    vehicleCounts,
    currentVehicle,
    vehicleIndex,
    totalVehicles,
    vehicles,
    hasPublicTransport,
    ptAmount,
  } = ctx;

  if (step === 'vehicle-ownership') {
    return { type: 'nextStep', step: hasVehicle ? 'vehicle-counts' : 'public-transport' };
  }

  if (step === 'vehicle-counts') {
    const total = vehicleCounts.passenger + vehicleCounts.motorcycle + vehicleCounts.bicycle;
    if (total === 0) {
      return { type: 'validationError', key: 'onboarding.transport.vehicleCounts.validation' };
    }
    const newVehicles = buildVehiclesFromCounts(vehicleCounts);
    const firstStep = newVehicles[0]?.category === 'bicycle' ? 'vehicle-insurance' : 'vehicle-fuel';
    return {
      type: 'nextStep',
      step: firstStep,
      vehicleIndex: 0,
      vehicles: newVehicles,
    };
  }

  if (step === 'vehicle-fuel') {
    const v = currentVehicle;
    if (!v) return { type: 'nextStep', step: 'vehicle-fuel' };
    if (v.category === 'bicycle') return { type: 'nextStep', step: 'vehicle-summary' };
    if (!v.fuelType || !v.fuelCost) {
      return { type: 'validationError', key: 'onboarding.transport.vehicleFuel.validation' };
    }
    return { type: 'nextStep', step: 'vehicle-insurance' };
  }

  if (step === 'vehicle-insurance') {
    const v = currentVehicle;
    if (!v) return { type: 'nextStep', step: 'vehicle-insurance' };
    if (vehicleRequiresInsurance(v) && !v.insuranceCoverageType) {
      return { type: 'validationError', key: 'onboarding.transport.vehicleInsurance.validationCoverageType' };
    }
    if (vehicleRequiresInsurance(v) && v.insuranceCoverageType === 'tpl' && !v.insuranceLiabilityAmount) {
      return { type: 'validationError', key: 'onboarding.transport.vehicleInsurance.validationLiabilityAmount' };
    }
    if (vehicleRequiresInsurance(v) && !v.insurancePremium) {
      return { type: 'validationError', key: 'onboarding.transport.vehicleInsurance.validation' };
    }
    return { type: 'nextStep', step: v.category === 'bicycle' ? 'vehicle-summary' : 'vehicle-maintenance' };
  }

  if (step === 'vehicle-maintenance') {
    const v = currentVehicle;
    if (!v) return { type: 'nextStep', step: 'vehicle-maintenance' };
    if (v.hasParking && !v.parkingAmount) {
      return { type: 'validationError', key: 'onboarding.transport.vehicleMaintenance.validation' };
    }
    return { type: 'nextStep', step: 'vehicle-summary' };
  }

  if (step === 'vehicle-summary') {
    if (vehicleIndex < totalVehicles - 1) {
      const nextIdx = vehicleIndex + 1;
      const nextCategory = vehicles?.[nextIdx]?.category;
      return {
        type: 'nextStep',
        step: nextCategory === 'bicycle' ? 'vehicle-insurance' : 'vehicle-fuel',
        vehicleIndex: nextIdx,
      };
    }
    return { type: 'nextStep', step: 'public-transport' };
  }

  if (step === 'public-transport') {
    if (hasPublicTransport && !ptAmount) {
      return { type: 'validationError', key: 'onboarding.transport.publicTransport.validation' };
    }
    return { type: 'complete' };
  }

  return { type: 'complete' };
}

/**
 * @param {object} ctx
 * @returns {{ type: 'setStep', step: TransportStep, vehicleIndex?: number }
 *   | { type: 'leaveSection' }}
 */
export function resolveTransportBack(ctx) {
  const { step, vehicleIndex, currentVehicle, hasVehicle, totalVehicles } = ctx;

  if (step === 'vehicle-ownership') return { type: 'leaveSection' };
  if (step === 'vehicle-counts') return { type: 'setStep', step: 'vehicle-ownership' };

  if (step === 'vehicle-fuel') {
    if (vehicleIndex > 0) {
      return { type: 'setStep', step: 'vehicle-summary', vehicleIndex: vehicleIndex - 1 };
    }
    return { type: 'setStep', step: 'vehicle-counts' };
  }

  if (step === 'vehicle-insurance') {
    if (currentVehicle?.category === 'bicycle') {
      if (vehicleIndex > 0) {
        return { type: 'setStep', step: 'vehicle-summary', vehicleIndex: vehicleIndex - 1 };
      }
      return { type: 'setStep', step: 'vehicle-counts' };
    }
    return { type: 'setStep', step: 'vehicle-fuel' };
  }

  if (step === 'vehicle-maintenance') return { type: 'setStep', step: 'vehicle-insurance' };

  if (step === 'vehicle-summary') {
    if (currentVehicle?.category === 'bicycle') {
      return { type: 'setStep', step: 'vehicle-insurance' };
    }
    return { type: 'setStep', step: 'vehicle-maintenance' };
  }

  if (step === 'public-transport') {
    if (hasVehicle && totalVehicles > 0) {
      return { type: 'setStep', step: 'vehicle-summary', vehicleIndex: totalVehicles - 1 };
    }
    return { type: 'setStep', step: 'vehicle-ownership' };
  }

  return { type: 'leaveSection' };
}

/**
 * Build persisted transport payload from form state.
 * @param {object} state
 */
export function buildTransportPayload(state) {
  const {
    hasVehicle,
    vehicleCounts,
    vehicles,
    hasPublicTransport,
    ptAmount,
    ptFrequency,
    ptEndDate,
    ptDueDate,
    ptChargeDay,
  } = state;

  return {
    hasVehicle,
    vehicleCounts: hasVehicle ? vehicleCounts : null,
    vehicles: hasVehicle ? vehicles.map((v) => ({
      ...v,
      hasInsurance: isMandatoryVehicleInsurance(v.category) ? true : v.hasInsurance,
      fuelCost: v.fuelCost ? parseFloat(v.fuelCost) || 0 : null,
      insurancePremium: v.insurancePremium ? parseFloat(v.insurancePremium) || 0 : null,
      insuranceLiabilityAmount: v.insuranceLiabilityAmount ? parseFloat(v.insuranceLiabilityAmount) || 0 : null,
      parkingAmount: v.parkingAmount ? parseFloat(v.parkingAmount) || 0 : null,
      motInspectionCost: v.motInspectionCost ? parseFloat(v.motInspectionCost) || 0 : null,
      maintenanceItems: v.hasPlannedMaintenance
        ? serializeMaintenanceItems(v.maintenanceItems)
        : [],
    })) : [],
    fuelType: hasVehicle && vehicles[0] ? vehicles[0].fuelType : null,
    fuelCost: hasVehicle && vehicles[0] ? parseFloat(vehicles[0].fuelCost) || 0 : null,
    hasInsurance: hasVehicle && vehicles[0] ? vehicles[0].hasInsurance : null,
    insurancePremium: hasVehicle && vehicles[0] && vehicles[0].hasInsurance ? parseFloat(vehicles[0].insurancePremium) || 0 : null,
    insuranceFrequency: hasVehicle && vehicles[0] && vehicles[0].hasInsurance ? vehicles[0].insuranceFrequency : null,
    insuranceRenewalDate: hasVehicle && vehicles[0] && vehicles[0].hasInsurance
      ? vehicles[0].insuranceEndDate || vehicles[0].insuranceStartDate || vehicles[0].insuranceRenewalDate || null
      : null,
    hasParking: hasVehicle && vehicles[0] ? vehicles[0].hasParking : null,
    parkingAmount: hasVehicle && vehicles[0] && vehicles[0].hasParking ? parseFloat(vehicles[0].parkingAmount) || 0 : null,
    parkingFrequency: hasVehicle && vehicles[0] && vehicles[0].hasParking ? vehicles[0].parkingFrequency : null,
    motDate: hasVehicle && vehicles[0] ? vehicles[0].motDate || null : null,
    hasPlannedMaintenance: hasVehicle && vehicles[0] ? vehicles[0].hasPlannedMaintenance : null,
    maintenanceItems: hasVehicle && vehicles[0] && vehicles[0].hasPlannedMaintenance
      ? serializeMaintenanceItems(vehicles[0].maintenanceItems)
      : [],
    hasPublicTransport,
    ptAmount: hasPublicTransport ? parseFloat(ptAmount) || 0 : null,
    ptFrequency: hasPublicTransport ? ptFrequency : null,
    ptEndDate: hasPublicTransport ? ptEndDate || null : null,
    ptDueDate: hasPublicTransport ? ptDueDate || null : null,
    ptChargeDay: hasPublicTransport && ptChargeDay ? parseInt(ptChargeDay, 10) || null : null,
    ptValidUntil: hasPublicTransport ? ptEndDate || null : null,
  };
}
