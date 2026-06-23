import { EDIT_SECTION_ROUTES } from './sectionEditPaths';

/** @typedef {'vehicle_tpl_liability'} FinancialRiskKind */

/**
 * @typedef {Object} FinancialRisk
 * @property {string} id
 * @property {FinancialRiskKind} kind
 * @property {string} label
 * @property {number} exposureAmount - Maximum liability exposure (not a monthly budget line)
 * @property {string} category
 * @property {string|null} editRoute
 */

const VEHICLE_CATEGORY_LABEL_KEYS = {
  passenger: 'onboarding.transport.vehicleCounts.passenger',
  motorcycle: 'onboarding.transport.vehicleCounts.motorcycle',
  bicycle: 'onboarding.transport.vehicleCounts.bicycle',
};

/**
 * TPL liability limits — tracked as financial exposure, not monthly costs.
 * @param {object|null|undefined} transport
 * @param {(key: string, params?: object) => string} t
 * @returns {FinancialRisk[]}
 */
export function collectVehicleInsuranceRisks(transport, t) {
  if (!transport?.hasVehicle || !Array.isArray(transport.vehicles)) return [];

  const multi = transport.vehicles.length > 1;

  return transport.vehicles.flatMap((vehicle, index) => {
    if (!vehicle?.hasInsurance || vehicle.insuranceCoverageType !== 'tpl') return [];

    const exposureAmount = parseFloat(vehicle.insuranceLiabilityAmount);
    if (!exposureAmount || exposureAmount <= 0) return [];

    const categoryKey = VEHICLE_CATEGORY_LABEL_KEYS[vehicle.category];
    const categoryLabel = categoryKey ? t(categoryKey) : t('onboarding.transport.vehicleCounts.passenger');
    const label = multi
      ? t('dashboard.risks.vehicleTplLiabilityN', { n: index + 1, category: categoryLabel })
      : t('dashboard.risks.vehicleTplLiability', { category: categoryLabel });

    return [{
      id: `vehicle-tpl-${index}`,
      kind: 'vehicle_tpl_liability',
      label,
      exposureAmount,
      category: 'transport',
      editRoute: EDIT_SECTION_ROUTES.transport,
    }];
  });
}

/**
 * @param {import('./householdBudget').RawSections} sections
 * @param {(key: string, params?: object) => string} t
 * @returns {FinancialRisk[]}
 */
export function collectHouseholdRisks(sections, t) {
  return collectVehicleInsuranceRisks(sections?.transport, t);
}
