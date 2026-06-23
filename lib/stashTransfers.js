import {
  creditCustomStash,
  debitCustomStash,
  getCustomStashById,
  getCustomStashes,
} from './customStashes';
import { roundMoney } from './finance';
import { logStashTransferMovements } from './stashMovements';

/** @typedef {'looseCash'|'savings'|`stash:${string}`} StashRef */

/**
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {import('./schema').Income|null|undefined} income
 * @param {StashRef} ref
 * @returns {number}
 */
export function getStashBalance(budget, income, ref) {
  if (ref === 'looseCash') return Number(budget?.looseMoneyBalance) || 0;
  if (ref === 'savings') return Number(income?.savingsBalance) || 0;
  if (ref.startsWith('stash:')) {
    const stash = getCustomStashById(budget, ref.slice('stash:'.length));
    return Number(stash?.balance) || 0;
  }
  return 0;
}

/**
 * @param {import('./schema').Budget} budget
 * @param {import('./schema').Income|null|undefined} income
 * @param {StashRef} ref
 * @param {number} amount
 * @returns {boolean}
 */
export function creditStashRef(budget, income, ref, amount) {
  const amt = Math.max(0, roundMoney(amount));
  if (amt === 0) return true;

  if (ref === 'looseCash') {
    budget.looseMoneyBalance = (Number(budget.looseMoneyBalance) || 0) + amt;
    return true;
  }
  if (ref === 'savings') {
    if (!income) return false;
    income.savingsBalance = (Number(income.savingsBalance) || 0) + amt;
    return true;
  }
  if (ref.startsWith('stash:')) {
    return creditCustomStash(budget, ref.slice('stash:'.length), amt);
  }
  return false;
}

/**
 * @param {import('./schema').Budget} budget
 * @param {import('./schema').Income|null|undefined} income
 * @param {StashRef} ref
 * @param {number} amount
 * @returns {boolean}
 */
export function debitStashRef(budget, income, ref, amount) {
  const amt = Math.max(0, roundMoney(amount));
  if (amt === 0) return true;

  if (ref === 'looseCash') {
    const current = Number(budget.looseMoneyBalance) || 0;
    if (current < amt) return false;
    budget.looseMoneyBalance = current - amt;
    return true;
  }
  if (ref === 'savings') {
    if (!income) return false;
    const current = Number(income.savingsBalance) || 0;
    if (current < amt) return false;
    income.savingsBalance = current - amt;
    return true;
  }
  if (ref.startsWith('stash:')) {
    return debitCustomStash(budget, ref.slice('stash:'.length), amt);
  }
  return false;
}

/**
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {import('./schema').Income|null|undefined} income
 * @param {(key: string, params?: Record<string, string>) => string} t
 * @param {{ excludeRef?: StashRef|null }} [options]
 * @returns {{ id: StashRef, label: string, kind: 'primary'|'custom' }[]}
 */
export function buildStashDestinationOptions(budget, income, t, options = {}) {
  const { excludeRef = null } = options;
  /** @type {{ id: StashRef, label: string, kind: 'primary'|'custom' }[]} */
  const optionsList = [];

  if (excludeRef !== 'looseCash') {
    optionsList.push({
      id: 'looseCash',
      label: t('dashboard.home.jars.looseCash.title'),
      kind: 'primary',
    });
  }
  if (excludeRef !== 'savings') {
    optionsList.push({
      id: 'savings',
      label: t('dashboard.home.jars.savings.title'),
      kind: 'primary',
    });
  }

  getCustomStashes(budget).forEach((stash) => {
    const ref = /** @type {StashRef} */ (`stash:${stash.id}`);
    if (ref !== excludeRef) {
      optionsList.push({ id: ref, label: stash.name, kind: 'custom' });
    }
  });

  return optionsList;
}

/**
 * Move money between stash tabs.
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {import('./schema').Income|null|undefined} income
 * @param {StashRef} fromRef
 * @param {StashRef} toRef
 * @param {number} amount
 * @returns {{ budget: import('./schema').Budget, income: import('./schema').Income, error: 'same'|'invalid'|'insufficient'|'destination'|null }}
 */
export function transferBetweenStashes(budget, income, fromRef, toRef, amount) {
  let nextBudget = budget && typeof budget === 'object' ? { ...budget } : {};
  const nextIncome = income && typeof income === 'object' ? { ...income } : {};

  if (fromRef === toRef) {
    return { budget: nextBudget, income: nextIncome, error: 'same' };
  }

  const amt = roundMoney(Number(amount));
  if (!Number.isFinite(amt) || amt <= 0) {
    return { budget: nextBudget, income: nextIncome, error: 'invalid' };
  }

  if (getStashBalance(nextBudget, nextIncome, fromRef) < amt) {
    return { budget: nextBudget, income: nextIncome, error: 'insufficient' };
  }

  if (!debitStashRef(nextBudget, nextIncome, fromRef, amt)) {
    return { budget: nextBudget, income: nextIncome, error: 'insufficient' };
  }

  if (!creditStashRef(nextBudget, nextIncome, toRef, amt)) {
    return { budget: nextBudget, income: nextIncome, error: 'destination' };
  }

  nextBudget = logStashTransferMovements(nextBudget, nextIncome, fromRef, toRef, amt);

  return { budget: nextBudget, income: nextIncome, error: null };
}

/**
 * Route a deleted custom stash balance to another tab, then remove the stash.
 * @param {import('./schema').Budget|null|undefined} budget
 * @param {string} stashId
 * @param {{ income?: import('./schema').Income|null, destination?: StashRef }} [options]
 * @returns {{ budget: import('./schema').Budget, income: import('./schema').Income|null, removed: import('./schema').CustomStash|null, error: 'notFound'|'destination'|null }}
 */
export function removeCustomStashWithDestination(budget, stashId, options = {}) {
  const base = budget && typeof budget === 'object' ? { ...budget } : {};
  const stashes = getCustomStashes(base);
  const index = stashes.findIndex((stash) => stash.id === stashId);
  if (index < 0) {
    return { budget: base, income: options.income ?? null, removed: null, error: 'notFound' };
  }

  const removed = stashes[index];
  const balance = Number(removed.balance) || 0;
  const destination = options.destination || 'looseCash';
  const nextStashes = stashes.filter((stash) => stash.id !== stashId);
  let nextBudget = { ...base, customStashes: nextStashes };
  const nextIncome = options.income && typeof options.income === 'object'
    ? { ...options.income }
    : null;

  if (balance > 0 && !creditStashRef(nextBudget, nextIncome, destination, balance)) {
    return { budget: base, income: options.income ?? null, removed: null, error: 'destination' };
  }

  if (balance > 0) {
    const fromRef = /** @type {StashRef} */ (`stash:${stashId}`);
    nextBudget = logStashTransferMovements(
      nextBudget,
      nextIncome,
      fromRef,
      destination,
      balance,
    );
  }

  if (nextBudget.resetUnspentStashId === stashId) {
    nextBudget.resetUnspentStashId = nextStashes[0]?.id ?? null;
  }

  return { budget: nextBudget, income: nextIncome, removed, error: null };
}
