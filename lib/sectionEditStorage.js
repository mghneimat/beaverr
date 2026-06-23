import { formatAmountInput, parseMoneyAmount } from './finance';

/** @type {Record<string, string>} */
export const SECTION_STORAGE_KEYS = {
  household: 'beaverr_household',
  location: 'beaverr_location',
  income: 'beaverr_income',
  housing: 'beaverr_housing',
  transport: 'beaverr_transport',
  health: 'beaverr_health',
  'childrenCosts': 'beaverr_children_costs',
  pets: 'beaverr_pets',
  subscriptions: 'beaverr_subscriptions',
  'other-costs': 'beaverr_other_costs',
  debts: 'beaverr_debts',
  budget: 'beaverr_budget',
  goals: 'beaverr_goals',
};

export function parseAmount(value) {
  return parseMoneyAmount(value);
}

export function amountToString(value) {
  if (value == null || value === '') return '';
  const n = Number(value);
  if (Number.isFinite(n)) return formatAmountInput(n);
  return String(value);
}
