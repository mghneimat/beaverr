import { isoDateKey } from './dailyLog';
import { removeCustomStashWithDestination } from './stashTransfers';
import { roundMoney } from './finance';

/** @typedef {import('./schema').CustomStash} CustomStash */
/** @typedef {import('./schema').Budget} Budget */

export const STASH_NAME_MAX_LENGTH = 40;
export const STASH_DESCRIPTION_MAX_LENGTH = 120;

const LEGACY_MIGRATION_FALLBACK_NAME = 'Goal';

/**
 * @param {string} name
 * @returns {string}
 */
export function normalizeStashName(name) {
  return (name || '').trim();
}

/**
 * @param {string|null|undefined} description
 * @returns {string|null}
 */
export function normalizeStashDescription(description) {
  const normalized = (description || '').trim();
  return normalized.length > 0 ? normalized : null;
}

/**
 * @param {Budget|null|undefined} budget
 * @returns {CustomStash[]}
 */
export function getCustomStashes(budget) {
  return Array.isArray(budget?.customStashes) ? budget.customStashes : [];
}

/**
 * @param {Budget|null|undefined} budget
 * @param {string} stashId
 * @returns {CustomStash|null}
 */
export function getCustomStashById(budget, stashId) {
  if (!stashId) return null;
  return getCustomStashes(budget).find((stash) => stash.id === stashId) || null;
}

/**
 * @param {Budget|null|undefined} budget
 * @param {string} name
 * @param {string|null} [excludeId]
 * @returns {boolean}
 */
export function isDuplicateStashName(budget, name, excludeId = null) {
  const norm = normalizeStashName(name).toLowerCase();
  if (!norm) return false;
  return getCustomStashes(budget).some(
    (stash) => stash.id !== excludeId && stash.name.toLowerCase() === norm,
  );
}

/**
 * @param {string} name
 * @param {string|null|undefined} [description]
 * @param {Date} [now]
 * @returns {CustomStash}
 */
export function createCustomStash(name, description = null, now = new Date()) {
  const normalized = normalizeStashName(name);
  if (!normalized) {
    throw new Error('stash name required');
  }
  if (normalized.length > STASH_NAME_MAX_LENGTH) {
    throw new Error('stash name too long');
  }

  const desc = normalizeStashDescription(description);
  if (description != null && String(description).trim().length > STASH_DESCRIPTION_MAX_LENGTH) {
    throw new Error('stash description too long');
  }

  return {
    id: `stash_${Date.now()}`,
    name: normalized,
    balance: 0,
    createdAt: isoDateKey(now),
    ...(desc ? { description: desc } : {}),
  };
}

/**
 * @param {Budget} budget
 * @param {string} stashId
 * @param {number} amount
 * @returns {boolean}
 */
export function creditCustomStash(budget, stashId, amount) {
  const stashes = getCustomStashes(budget);
  const index = stashes.findIndex((stash) => stash.id === stashId);
  if (index < 0) return false;

  const next = [...stashes];
  next[index] = {
    ...next[index],
    balance: (Number(next[index].balance) || 0) + Math.max(0, roundMoney(amount)),
  };
  budget.customStashes = next;
  return true;
}

/**
 * @param {Budget|null|undefined} budget
 * @param {string} name
 * @param {string|null|undefined} [description]
 * @returns {{ budget: Budget, stash: CustomStash|null, error: 'empty'|'tooLong'|'duplicate'|'descriptionTooLong'|null }}
 */
export function addCustomStash(budget, name, description = null) {
  const base = budget && typeof budget === 'object' ? { ...budget } : {};
  const normalized = normalizeStashName(name);

  if (!normalized) {
    return { budget: base, stash: null, error: 'empty' };
  }
  if (normalized.length > STASH_NAME_MAX_LENGTH) {
    return { budget: base, stash: null, error: 'tooLong' };
  }
  if (isDuplicateStashName(base, normalized)) {
    return { budget: base, stash: null, error: 'duplicate' };
  }

  const rawDescription = description == null ? '' : String(description);
  if (rawDescription.trim().length > STASH_DESCRIPTION_MAX_LENGTH) {
    return { budget: base, stash: null, error: 'descriptionTooLong' };
  }

  const stash = createCustomStash(normalized, description);
  const next = {
    ...base,
    customStashes: [...getCustomStashes(base), stash],
  };

  if (next.resetUnspentDestination === 'otherGoal' && !next.resetUnspentStashId) {
    next.resetUnspentStashId = stash.id;
  }

  return { budget: next, stash, error: null };
}

/**
 * Update a custom stash tab name and/or description.
 * @param {Budget|null|undefined} budget
 * @param {string} stashId
 * @param {{ name: string, description?: string|null|undefined }} fields
 * @returns {{ budget: Budget, stash: CustomStash|null, error: 'notFound'|'empty'|'tooLong'|'duplicate'|'descriptionTooLong'|'unchanged'|null }}
 */
export function updateCustomStash(budget, stashId, fields) {
  const base = budget && typeof budget === 'object' ? { ...budget } : {};
  const normalized = normalizeStashName(fields?.name);
  const stashes = getCustomStashes(base);
  const index = stashes.findIndex((stash) => stash.id === stashId);

  if (index < 0) {
    return { budget: base, stash: null, error: 'notFound' };
  }
  if (!normalized) {
    return { budget: base, stash: null, error: 'empty' };
  }
  if (normalized.length > STASH_NAME_MAX_LENGTH) {
    return { budget: base, stash: null, error: 'tooLong' };
  }
  if (isDuplicateStashName(base, normalized, stashId)) {
    return { budget: base, stash: null, error: 'duplicate' };
  }

  const rawDescription = fields?.description == null ? '' : String(fields.description);
  if (rawDescription.trim().length > STASH_DESCRIPTION_MAX_LENGTH) {
    return { budget: base, stash: null, error: 'descriptionTooLong' };
  }

  const nextDescription = normalizeStashDescription(fields?.description);
  const current = stashes[index];
  const currentDescription = normalizeStashDescription(current.description);

  if (current.name === normalized && currentDescription === nextDescription) {
    return { budget: base, stash: current, error: 'unchanged' };
  }

  const nextStashes = [...stashes];
  const updated = {
    ...current,
    name: normalized,
    ...(nextDescription ? { description: nextDescription } : {}),
  };
  if (!nextDescription && updated.description) {
    delete updated.description;
  }
  nextStashes[index] = updated;
  return {
    budget: { ...base, customStashes: nextStashes },
    stash: updated,
    error: null,
  };
}

/**
 * @deprecated Use updateCustomStash
 * @param {Budget|null|undefined} budget
 * @param {string} stashId
 * @param {string} name
 * @returns {{ budget: Budget, stash: CustomStash|null, error: 'notFound'|'empty'|'tooLong'|'duplicate'|'unchanged'|null }}
 */
export function renameCustomStash(budget, stashId, name) {
  const current = getCustomStashById(budget, stashId);
  return updateCustomStash(budget, stashId, {
    name,
    description: current?.description ?? null,
  });
}

/**
 * Debit a custom stash balance.
 * @param {Budget} budget
 * @param {string} stashId
 * @param {number} amount
 * @returns {boolean}
 */
export function debitCustomStash(budget, stashId, amount) {
  const stashes = getCustomStashes(budget);
  const index = stashes.findIndex((stash) => stash.id === stashId);
  if (index < 0) return false;

  const current = Number(stashes[index].balance) || 0;
  const amt = Math.max(0, roundMoney(amount));
  if (current < amt) return false;

  const next = [...stashes];
  next[index] = { ...next[index], balance: current - amt };
  budget.customStashes = next;
  return true;
}

/**
 * Remove a custom stash; its balance moves to the piggy bank.
 * @deprecated Use removeCustomStashWithDestination from stashTransfers.js
 * @param {Budget|null|undefined} budget
 * @param {string} stashId
 * @returns {{ budget: Budget, removed: CustomStash|null, error: 'notFound'|null }}
 */
export function removeCustomStash(budget, stashId) {
  const { budget: next, removed, error } = removeCustomStashWithDestination(
    budget,
    stashId,
    { destination: 'looseCash' },
  );
  return { budget: next, removed, error: error === 'notFound' ? 'notFound' : null };
}

/**
 * Move legacy other-goal fields into customStashes when none exist yet.
 * @param {Budget|null|undefined} budget
 * @returns {{ budget: Budget, changed: boolean }}
 */
export function migrateLegacyOtherGoal(budget) {
  if (!budget || typeof budget !== 'object') {
    return { budget: budget || {}, changed: false };
  }

  if (getCustomStashes(budget).length > 0) {
    return { budget, changed: false };
  }

  const otherBalance = Number(budget.otherGoalBalance) || 0;
  const note = normalizeStashName(budget.resetOtherGoalNote);
  const hasLegacy = otherBalance > 0
    || note.length > 0
    || budget.resetUnspentDestination === 'otherGoal';

  if (!hasLegacy) {
    return { budget, changed: false };
  }

  const stash = createCustomStash(note || LEGACY_MIGRATION_FALLBACK_NAME);
  stash.balance = otherBalance;

  const next = {
    ...budget,
    customStashes: [stash],
    resetUnspentStashId: stash.id,
    otherGoalBalance: 0,
    resetOtherGoalNote: null,
  };

  return { budget: next, changed: true };
}
