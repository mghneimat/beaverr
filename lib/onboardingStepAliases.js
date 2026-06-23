/**
 * Legacy q* and kebab-case onboarding step ids → semantic camelCase ids.
 * Route-aware where the same legacy id maps differently (e.g. budget rollover step).
 */

/** @typedef {Record<string, string>} StepAliasMap */

/** @type {Record<string, StepAliasMap>} */
export const LEGACY_STEP_ALIASES_BY_ROUTE = {
  income: {
    q5: 'yourIncome',
    q5a: 'partnerIncome',
    q5b: 'otherIncome',
    q5c: 'savings',
  },
  strategy: {
    q5d: 'goalIntents',
    'q5d-mode': 'goalMode',
    'q5d-details': 'goalDetails',
  },
  housing: {
    q6: 'housingStatus',
    q6a: 'rentDetails',
    q6b: 'rentUtilities',
    q6c: 'housingUtilities',
    q6d: 'mortgageStatus',
    q6e: 'mortgageDetails',
    q6f: 'ownershipCosts',
    q6g: 'govtTaxes',
    q6h: 'familyHousing',
  },
  transport: {
    q7: 'vehicleOwnership',
    q7Count: 'vehicleCounts',
    q7a: 'vehicleFuel',
    q7b: 'vehicleInsurance',
    q7c: 'vehicleMaintenance',
    q7d: 'vehicleService',
    q7e: 'publicTransport',
    q7bicycle: 'bicycle',
  },
  health: {
    q8: 'healthCoverage',
  },
  'childrenCosts': {
    q9: 'childrenCosts',
  },
  pets: {
    q10: 'hasPets',
    q10a: 'petDetails',
  },
  debts: {
    q13: 'hasDebts',
    q13a: 'debtDetails',
  },
  'budget-setup': {
    q14: 'budgetSplit',
    q14a: 'rollover',
  },
  'budget-rollover': {
    q14a: 'rollover',
  },
  'budget-spending-strategy': {
    q14b: 'spendingStrategy',
  },
};

/** Legacy kebab-case step ids → camelCase semantic ids. */
const KEBAB_TO_CAMEL = {
  'your-income': 'yourIncome',
  'partner-income': 'partnerIncome',
  'other-income': 'otherIncome',
  'goal-intents': 'goalIntents',
  'goal-mode': 'goalMode',
  'goal-details': 'goalDetails',
  'housing-status': 'housingStatus',
  'rent-details': 'rentDetails',
  'rent-utilities': 'rentUtilities',
  'housing-utilities': 'housingUtilities',
  'mortgage-status': 'mortgageStatus',
  'mortgage-details': 'mortgageDetails',
  'ownership-costs': 'ownershipCosts',
  'govt-taxes': 'govtTaxes',
  'family-housing': 'familyHousing',
  'vehicle-ownership': 'vehicleOwnership',
  'vehicle-counts': 'vehicleCounts',
  'vehicle-fuel': 'vehicleFuel',
  'vehicle-insurance': 'vehicleInsurance',
  'vehicle-maintenance': 'vehicleMaintenance',
  'vehicle-summary': 'vehicleService',
  'public-transport': 'publicTransport',
  'health-coverage': 'healthCoverage',
  'has-pets': 'hasPets',
  'pet-details': 'petDetails',
  'has-debts': 'hasDebts',
  'debt-details': 'debtDetails',
  'children-costs': 'childrenCosts',
  'budget-split': 'budgetSplit',
  'flexible-budget': 'rollover',
  'spending-strategy': 'spendingStrategy',
};

/** Flat legacy → semantic for route-agnostic lookups (first match wins). */
export const LEGACY_STEP_ALIASES_FLAT = Object.assign(
  {},
  ...Object.values(LEGACY_STEP_ALIASES_BY_ROUTE),
  KEBAB_TO_CAMEL,
);

/** @type {ReadonlySet<string>} */
const SEMANTIC_STEP_IDS = new Set(
  Object.values(LEGACY_STEP_ALIASES_BY_ROUTE).flatMap((map) => Object.values(map)),
);

/**
 * @param {string} route - Route name or full onboarding path
 * @returns {string}
 */
export function routeToStepName(route) {
  if (!route) return '';
  const cleaned = route.replace(/^\//, '');
  const parts = cleaned.split('/').filter(Boolean);
  const onboardingIdx = parts.indexOf('(onboarding)');
  if (onboardingIdx >= 0 && parts[onboardingIdx + 1]) {
    return parts[onboardingIdx + 1];
  }
  return parts[parts.length - 1] || route;
}

/**
 * Normalize a stored or URL step id to its semantic camelCase form.
 * @param {string} route - Route name (e.g. 'income') or full path
 * @param {string|undefined|null} step
 * @returns {string|undefined}
 */
export function normalizeOnboardingStep(route, step) {
  if (!step) return undefined;
  const routeName = routeToStepName(route);
  const routeAliases = LEGACY_STEP_ALIASES_BY_ROUTE[routeName];
  if (routeAliases?.[step]) return routeAliases[step];
  if (KEBAB_TO_CAMEL[step]) return KEBAB_TO_CAMEL[step];
  if (SEMANTIC_STEP_IDS.has(step)) return step;
  return step;
}

/**
 * Migrate legacy step field values in persisted onboarding section data.
 * @returns {Promise<number>} Number of storage records updated
 */
export async function migrateStoredStepFields() {
  const { getData, setData } = await import('./storage');
  const { ONBOARDING_STEP_REGISTRY } = await import('./onboardingStepRegistry');

  let updated = 0;

  for (const entry of Object.values(ONBOARDING_STEP_REGISTRY)) {
    if (!entry.stepField || !entry.storageKey) continue;

    const saved = await getData(entry.storageKey);
    if (!saved || typeof saved !== 'object') continue;

    const raw = saved[entry.stepField];
    if (!raw || typeof raw !== 'string') continue;

    const normalized = normalizeOnboardingStep(entry.routeName, raw);
    if (normalized === raw) continue;

    await setData(entry.storageKey, {
      ...saved,
      [entry.stepField]: normalized,
    });
    updated += 1;
  }

  return updated;
}
