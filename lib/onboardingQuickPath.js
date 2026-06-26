/**
 * Quick-setup routing — subset of full questionnaire screens.
 */

import { router } from 'expo-router';
import { getData, setData } from './storage';
import { notifyDashboardRefresh } from './dashboardRefresh';
import { snapshotQuickSetupData } from './onboardingExit';
import { DEFAULT_GOAL_INTENTS, buildIncomeGoalPayload } from './incomeGoals';
import {
  QUICK_RESUME_ROUTE,
  QUICK_SETUP_PERCENT,
  patchOnboardingState,
  getOnboardingState,
} from './onboardingProgress';

/** @typedef {import('./schema').OnboardingState} OnboardingState */

export const QUICK_HOUSING_ROUTE = '/(onboarding)/quick-housing';

/**
 * @param {OnboardingState|null|undefined} state
 * @returns {boolean}
 */
export function isQuickSetupMode(state) {
  return state?.setupMode === 'quick';
}

/**
 * Next route after completing a section during quick setup.
 * @param {'household'|'occupation'|'income'|'quick-housing'} section
 * @returns {string}
 */
export function getQuickSetupNextRoute(section) {
  switch (section) {
    case 'household':
      return '/(onboarding)/occupation';
    case 'occupation':
      return '/(onboarding)/splash-income';
    case 'income':
      return QUICK_HOUSING_ROUTE;
    case 'quick-housing':
      return '/(app)/dashboard';
    default:
      return '/(onboarding)/household';
  }
}

/**
 * Persist minimum viable data and unlock dashboard after quick housing.
 * @param {{ rentAmount: string, utilitiesAmount: string }} params
 */
export async function finishQuickSetup({ rentAmount, utilitiesAmount }) {
  const existingHousehold = (await getData('beaverr_household')) || {};

  await setData('beaverr_location', {
    country: 'CZ',
    city: null,
    currency: 'CZK',
  });

  const existingHousing = (await getData('beaverr_housing')) || {};
  await setData('beaverr_housing', {
    ...existingHousing,
    type: 'renting',
    rent: rentAmount ? parseFloat(rentAmount) : null,
    utilitiesMode: 'total',
    utilities: utilitiesAmount ? parseFloat(utilitiesAmount) : null,
    utilitiesFrequency: 'monthly',
    utilityItems: [],
    utilityBreakdown: null,
    utilityOtherRows: [],
    hasInternet: existingHousing.hasInternet ?? null,
    internetAmount: existingHousing.internetAmount ?? null,
    internetFrequency: existingHousing.internetFrequency ?? null,
    hasMortgage: existingHousing.hasMortgage ?? null,
    mortgageAmount: existingHousing.mortgageAmount ?? null,
    mortgageEndDate: existingHousing.mortgageEndDate ?? null,
    hasOtherCosts: false,
    otherCostRows: [],
    contributesToFamily: false,
    familyContributionRows: [],
    govtTaxes: existingHousing.govtTaxes ?? null,
  });

  const existingIncome = (await getData('beaverr_income')) || {};
  if (!existingIncome.goalIntents) {
    await setData('beaverr_income', {
      ...existingIncome,
      ...buildIncomeGoalPayload({
        goalIntents: DEFAULT_GOAL_INTENTS,
        saveMode: null,
        savingsBalance: '',
        savingsMonthlyTarget: '',
        goalDescription: '',
        goalAmount: '',
        goalDate: '',
      }),
    });
  }

  await setData('beaverr_household', {
    ...existingHousehold,
    displayName: existingHousehold.displayName ?? null,
  });

  await snapshotQuickSetupData();

  await patchOnboardingState({
    completed: false,
    dashboardUnlocked: true,
    questionnaireComplete: false,
    setupMode: 'quick',
    currentStep: 'quick-housing-done',
    resumeRoute: QUICK_RESUME_ROUTE,
    percentComplete: QUICK_SETUP_PERCENT,
  });

  notifyDashboardRefresh();
  router.replace('/(app)/dashboard');
}

/**
 * @returns {Promise<OnboardingState|null>}
 */
export async function loadQuickSetupState() {
  return getOnboardingState();
}
