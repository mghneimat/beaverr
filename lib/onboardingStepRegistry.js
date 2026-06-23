/**
 * Per-route onboarding step registry — steps, storage keys, resume/back helpers.
 */

import { STORAGE_KEYS } from './beaverrConstants';
import { asArray } from './asArray';
import { normalizeOnboardingStep } from './onboardingStepAliases';
import {
  buildHouseholdResumeRoute,
  householdNavParams,
  resolveHouseholdReturnPoint,
} from './householdOnboardingSave';
import {
  buildOccupationResumeRoute,
  occupationNavParams,
  resolveOccupationReturnPoint,
} from './occupationOnboardingSave';
import {
  buildIncomeResumeRoute,
  incomeNavParams,
  resolveIncomeReturnPoint,
} from './incomeOnboardingSave';
import {
  goalIntentsIncludeSaving,
  restoreGoalSelection,
} from './incomeGoals';
import {
  getNonCitizenPermitChain,
  residencePermitHref,
} from './citizenshipFlow';

/**
 * @typedef {Object} OnboardingStepReturnPoint
 * @property {string} step
 * @property {number} [childIndex]
 * @property {string} [subject]
 */

/**
 * @typedef {Object} OnboardingStepRegistryEntry
 * @property {string} routeName
 * @property {string} route
 * @property {string} storageKey
 * @property {string|null} stepField
 * @property {readonly string[]} steps
 * @property {(saved: object|null|undefined, context?: object) => OnboardingStepReturnPoint} resolveReturnPoint
 * @property {(step: string, extra?: OnboardingStepReturnPoint) => string} buildResumeRoute
 * @property {(step: string, extra?: OnboardingStepReturnPoint) => Record<string, string>|undefined} navParams
 */

/** @param {string} routeName @returns {string} */
function routePath(routeName) {
  return `/(onboarding)/${routeName}`;
}

/** @param {string} step @param {string} [query] @returns {string} */
function resumeHref(routeName, step, query) {
  const base = routePath(routeName);
  if (!step && !query) return base;
  const params = new URLSearchParams(query || '');
  if (step) params.set('step', step);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** @type {Record<string, OnboardingStepRegistryEntry>} */
export const ONBOARDING_STEP_REGISTRY = {
  household: {
    routeName: 'household',
    route: routePath('household'),
    storageKey: STORAGE_KEYS.household,
    stepField: 'householdOnboardingStep',
    steps: ['type', 'partner', 'children', 'numChildren', 'childDetails'],
    resolveReturnPoint: (saved) => resolveHouseholdReturnPoint(saved),
    buildResumeRoute: (step, extra) => buildHouseholdResumeRoute(step, extra?.childIndex ?? 0),
    navParams: (step, extra) => householdNavParams(step, extra?.childIndex ?? 0),
  },

  occupation: {
    routeName: 'occupation',
    route: routePath('occupation'),
    storageKey: STORAGE_KEYS.occupation,
    stepField: 'occupationOnboardingStep',
    steps: ['user', 'partner'],
    resolveReturnPoint: (saved, context) => (
      resolveOccupationReturnPoint(saved, context?.household)
    ),
    buildResumeRoute: (step) => buildOccupationResumeRoute(/** @type {'user'|'partner'} */ (step)),
    navParams: (step) => occupationNavParams(/** @type {'user'|'partner'} */ (step)),
  },

  income: {
    routeName: 'income',
    route: routePath('income'),
    storageKey: STORAGE_KEYS.income,
    stepField: 'incomeOnboardingStep',
    steps: ['yourIncome', 'partnerIncome', 'otherIncome', 'savings'],
    resolveReturnPoint: (saved) => resolveIncomeReturnPoint(saved),
    buildResumeRoute: (step) => buildIncomeResumeRoute(step),
    navParams: (step) => incomeNavParams(step),
  },

  strategy: {
    routeName: 'strategy',
    route: routePath('strategy'),
    storageKey: STORAGE_KEYS.income,
    stepField: null,
    steps: ['goalIntents', 'goalMode', 'goalDetails'],
    resolveReturnPoint: (saved) => {
      if (!saved || Array.isArray(saved)) {
        return { step: 'goalIntents' };
      }
      const { goalIntents, saveMode } = restoreGoalSelection(saved);
      if (saved.goalAmount || saved.savingsMonthlyTarget) {
        return { step: 'goalDetails' };
      }
      if (saveMode && goalIntentsIncludeSaving(goalIntents)) {
        return { step: 'goalMode' };
      }
      return { step: 'goalIntents' };
    },
    buildResumeRoute: (step) => resumeHref('strategy', normalizeOnboardingStep('strategy', step)),
    navParams: (step) => {
      const normalized = normalizeOnboardingStep('strategy', step);
      if (!normalized || normalized === 'goalIntents') return undefined;
      return { step: normalized };
    },
  },

  citizenship: {
    routeName: 'citizenship',
    route: routePath('citizenship'),
    storageKey: STORAGE_KEYS.location,
    stepField: null,
    steps: ['user', 'partner', 'child'],
    resolveReturnPoint: () => ({ step: 'user', subject: 'user' }),
    buildResumeRoute: () => routePath('citizenship'),
    navParams: () => undefined,
  },

  'residence-permit': {
    routeName: 'residence-permit',
    route: routePath('residence-permit'),
    storageKey: STORAGE_KEYS.location,
    stepField: null,
    steps: ['user', 'partner', 'child'],
    resolveReturnPoint: (saved, context) => {
      const chain = getNonCitizenPermitChain(saved, context?.household);
      const last = chain[chain.length - 1];
      if (!last) return { step: 'user', subject: 'user', childIndex: 0 };
      return {
        step: last.subject,
        subject: last.subject,
        childIndex: last.childIndex,
      };
    },
    buildResumeRoute: (step, extra) => {
      const subject = extra?.subject || step || 'user';
      const childIndex = extra?.childIndex ?? 0;
      return residencePermitHref(/** @type {'user'|'partner'|'child'} */ (subject), childIndex);
    },
    navParams: (step, extra) => {
      const subject = extra?.subject || step || 'user';
      /** @type {Record<string, string>} */
      const params = { subject };
      if (subject === 'child') {
        params.childIndex = String(extra?.childIndex ?? 0);
      }
      return params;
    },
  },

  housing: {
    routeName: 'housing',
    route: routePath('housing'),
    storageKey: STORAGE_KEYS.housing,
    stepField: 'housingOnboardingStep',
    steps: [
      'housingStatus',
      'rentDetails',
      'rentUtilities',
      'housingUtilities',
      'mortgageStatus',
      'mortgageDetails',
      'ownershipCosts',
      'govtTaxes',
      'familyHousing',
    ],
    resolveReturnPoint: (saved) => ({
      step: normalizeOnboardingStep('housing', saved?.housingOnboardingStep) || 'housingStatus',
    }),
    buildResumeRoute: (step) => resumeHref('housing', normalizeOnboardingStep('housing', step)),
    navParams: (step) => {
      const normalized = normalizeOnboardingStep('housing', step);
      if (!normalized || normalized === 'housingStatus') return undefined;
      return { step: normalized };
    },
  },

  transport: {
    routeName: 'transport',
    route: routePath('transport'),
    storageKey: STORAGE_KEYS.transport,
    stepField: 'transportOnboardingStep',
    steps: [
      'vehicleOwnership',
      'vehicleCounts',
      'vehicleFuel',
      'vehicleInsurance',
      'vehicleMaintenance',
      'vehicleService',
      'publicTransport',
      'bicycle',
    ],
    resolveReturnPoint: (saved) => ({
      step: normalizeOnboardingStep('transport', saved?.transportOnboardingStep) || 'vehicleOwnership',
    }),
    buildResumeRoute: (step) => resumeHref('transport', normalizeOnboardingStep('transport', step)),
    navParams: (step) => {
      const normalized = normalizeOnboardingStep('transport', step);
      if (!normalized || normalized === 'vehicleOwnership') return undefined;
      return { step: normalized };
    },
  },

  health: {
    routeName: 'health',
    route: routePath('health'),
    storageKey: STORAGE_KEYS.health,
    stepField: 'healthOnboardingStep',
    steps: ['healthCoverage'],
    resolveReturnPoint: () => ({ step: 'healthCoverage' }),
    buildResumeRoute: () => routePath('health'),
    navParams: () => undefined,
  },

  'childrenCosts': {
    routeName: 'childrenCosts',
    route: routePath('childrenCosts'),
    storageKey: STORAGE_KEYS.childrenCosts,
    stepField: null,
    steps: ['select', 'fill'],
    resolveReturnPoint: (saved) => {
      const hasCosts = saved?.children?.some(
        (child) => Array.isArray(child?.costs) && child.costs.length > 0,
      );
      return { step: hasCosts ? 'fill' : 'select' };
    },
    buildResumeRoute: (step) => resumeHref('childrenCosts', normalizeOnboardingStep('childrenCosts', step)),
    navParams: (step) => {
      const normalized = normalizeOnboardingStep('childrenCosts', step);
      if (!normalized || normalized === 'select') return undefined;
      return { step: normalized };
    },
  },

  pets: {
    routeName: 'pets',
    route: routePath('pets'),
    storageKey: STORAGE_KEYS.pets,
    stepField: null,
    steps: ['hasPets', 'petDetails'],
    resolveReturnPoint: (saved) => ({
      step: Array.isArray(saved) && saved.length > 0 ? 'petDetails' : 'hasPets',
    }),
    buildResumeRoute: (step) => resumeHref('pets', normalizeOnboardingStep('pets', step)),
    navParams: (step) => {
      const normalized = normalizeOnboardingStep('pets', step);
      if (!normalized || normalized === 'hasPets') return undefined;
      return { step: normalized };
    },
  },

  subscriptions: {
    routeName: 'subscriptions',
    route: routePath('subscriptions'),
    storageKey: STORAGE_KEYS.subscriptions,
    stepField: null,
    steps: ['select', 'fill'],
    resolveReturnPoint: (saved) => ({
      step: Array.isArray(saved) && saved.length > 0 ? 'fill' : 'select',
    }),
    buildResumeRoute: (step) => resumeHref('subscriptions', step === 'select' ? undefined : step),
    navParams: (step) => (step && step !== 'select' ? { step } : undefined),
  },

  'other-costs': {
    routeName: 'other-costs',
    route: routePath('other-costs'),
    storageKey: STORAGE_KEYS.otherCosts,
    stepField: null,
    steps: [],
    resolveReturnPoint: () => ({ step: '' }),
    buildResumeRoute: () => routePath('subscriptions'),
    navParams: () => undefined,
  },

  debts: {
    routeName: 'debts',
    route: routePath('debts'),
    storageKey: STORAGE_KEYS.debts,
    stepField: null,
    steps: ['hasDebts', 'debtDetails'],
    resolveReturnPoint: (saved) => ({
      step: Array.isArray(saved) && saved.length > 0 ? 'debtDetails' : 'hasDebts',
    }),
    buildResumeRoute: (step) => resumeHref('debts', normalizeOnboardingStep('debts', step)),
    navParams: (step) => {
      const normalized = normalizeOnboardingStep('debts', step);
      if (!normalized || normalized === 'hasDebts') return undefined;
      return { step: normalized };
    },
  },

  'budget-setup': {
    routeName: 'budget-setup',
    route: routePath('budget-setup'),
    storageKey: STORAGE_KEYS.budget,
    stepField: 'budgetOnboardingStep',
    steps: ['budgetSplit', 'rollover'],
    resolveReturnPoint: (saved) => {
      const step = normalizeOnboardingStep('budget-setup', saved?.budgetOnboardingStep);
      if (step === 'rollover') {
        return { step: 'rollover' };
      }
      return { step: 'budgetSplit' };
    },
    buildResumeRoute: (step) => {
      const normalized = normalizeOnboardingStep('budget-setup', step);
      if (normalized === 'rollover') {
        return routePath('budget-rollover');
      }
      return routePath('budget-setup');
    },
    navParams: () => undefined,
  },

  'budget-rollover': {
    routeName: 'budget-rollover',
    route: routePath('budget-rollover'),
    storageKey: STORAGE_KEYS.budget,
    stepField: 'budgetOnboardingStep',
    steps: ['rollover'],
    resolveReturnPoint: (saved) => {
      const raw = saved?.budgetOnboardingStep;
      const normalized = raw
        ? normalizeOnboardingStep('budget-rollover', raw)
        : 'rollover';
      if (normalized === 'spendingStrategy') {
        return { step: 'spendingStrategy' };
      }
      if (normalized === 'rollover') {
        return { step: 'rollover' };
      }
      return { step: normalized || 'rollover' };
    },
    buildResumeRoute: (step) => {
      const normalized = normalizeOnboardingStep('budget-rollover', step);
      if (normalized === 'spendingStrategy') {
        return routePath('budget-spending-strategy');
      }
      return routePath('budget-rollover');
    },
    navParams: () => undefined,
  },

  'budget-spending-strategy': {
    routeName: 'budget-spending-strategy',
    route: routePath('budget-spending-strategy'),
    storageKey: STORAGE_KEYS.budget,
    stepField: 'budgetOnboardingStep',
    steps: ['spendingStrategy'],
    resolveReturnPoint: (saved) => ({
      step: normalizeOnboardingStep('budget-spending-strategy', saved?.budgetOnboardingStep)
        || 'spendingStrategy',
    }),
    buildResumeRoute: () => routePath('budget-spending-strategy'),
    navParams: () => undefined,
  },
};

/** @type {Record<string, string[]>} */
export const STEPS_BY_ROUTE = Object.fromEntries(
  Object.entries(ONBOARDING_STEP_REGISTRY)
    .filter(([, entry]) => asArray(entry.steps).length > 0)
    .map(([name, entry]) => [name, asArray(entry.steps)]),
);

/**
 * @param {string} routeName
 * @returns {OnboardingStepRegistryEntry|null}
 */
export function getOnboardingStepRegistryEntry(routeName) {
  return ONBOARDING_STEP_REGISTRY[routeName] ?? null;
}
