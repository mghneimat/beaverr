import {
  addCustomStash,
  creditCustomStash,
  getCustomStashById,
  isDuplicateStashName,
  migrateLegacyOtherGoal,
  removeCustomStash,
  renameCustomStash,
  updateCustomStash,
} from '../../lib/customStashes';
import { migrateBudgetPolicy } from '../../lib/budgetMigration';
import { buildJarLines, buildSavingsStashLines, getTotalStashBalance } from '../../lib/jarRouting';
import { removeCustomStashWithDestination } from '../../lib/stashTransfers';
import { applyMonthEndRoute } from '../../lib/monthEndRouting';

describe('addCustomStash', () => {
  it('appends a named stash to the budget', () => {
    const { budget, stash, error } = addCustomStash({}, 'Holiday fund');
    expect(error).toBeNull();
    expect(stash?.name).toBe('Holiday fund');
    expect(budget.customStashes).toHaveLength(1);
    expect(budget.customStashes[0].balance).toBe(0);
  });

  it('rejects duplicate names case-insensitively', () => {
    const first = addCustomStash({}, 'Holiday');
    const second = addCustomStash(first.budget, 'holiday');
    expect(second.error).toBe('duplicate');
  });

  it('sets resetUnspentStashId when reset destination is otherGoal', () => {
    const { budget } = addCustomStash(
      { resetUnspentDestination: 'otherGoal' },
      'Renovation',
    );
    expect(budget.resetUnspentStashId).toBe(budget.customStashes[0].id);
  });
});

describe('migrateLegacyOtherGoal', () => {
  it('moves legacy other-goal balance and note into customStashes', () => {
    const { budget, changed } = migrateLegacyOtherGoal({
      otherGoalBalance: 2500,
      resetOtherGoalNote: 'Summer holiday',
      resetUnspentDestination: 'otherGoal',
    });
    expect(changed).toBe(true);
    expect(budget.customStashes).toHaveLength(1);
    expect(budget.customStashes[0].name).toBe('Summer holiday');
    expect(budget.customStashes[0].balance).toBe(2500);
    expect(budget.otherGoalBalance).toBe(0);
    expect(budget.resetOtherGoalNote).toBeNull();
    expect(budget.resetUnspentStashId).toBe(budget.customStashes[0].id);
  });

  it('is wired through migrateBudgetPolicy', () => {
    const { budget, changed } = migrateBudgetPolicy({
      otherGoalBalance: 1000,
      resetOtherGoalNote: 'Car fund',
    });
    expect(changed).toBe(true);
    expect(budget.customStashes).toHaveLength(1);
  });
});

describe('buildJarLines custom stashes', () => {
  it('includes each custom stash in jar lines', () => {
    const { budget } = addCustomStash({}, 'Gifts');
    const lines = buildJarLines({
      budget,
      effectiveMonthlyFlexible: 10000,
      income: {},
    });
    const customLine = lines.find((line) => line.id.startsWith('stash:'));
    expect(customLine).toBeDefined();
    expect(customLine.labelParams.name).toBe('Gifts');
  });
});

describe('buildSavingsStashLines', () => {
  it('keeps piggy bank and savings on the primary row with custom tabs below', () => {
    const { budget } = addCustomStash({ looseMoneyBalance: 12000 }, 'Holiday');
    const { primary, custom } = buildSavingsStashLines({
      budget,
      income: { savingsBalance: 500 },
    });
    expect(primary.map((line) => line.id)).toEqual(['looseCash', 'savings']);
    expect(custom).toHaveLength(1);
    expect(custom[0].labelParams.name).toBe('Holiday');
  });

  it('getTotalStashBalance sums piggy bank, savings, and custom tabs', () => {
    const first = addCustomStash({ looseMoneyBalance: 59634.12 }, 'ABCD');
    first.budget.customStashes[0].balance = 7777;
    const second = addCustomStash(first.budget, 'Test2');
    second.budget.customStashes[1].balance = 8456;

    const total = getTotalStashBalance(second.budget, { savingsBalance: 25500 });
    expect(total).toBeCloseTo(101367.12, 2);
  });
});

describe('removeCustomStash', () => {
  it('removes the stash and moves balance to piggy bank', () => {
    const { budget, stash } = addCustomStash({ looseMoneyBalance: 1000 }, 'Travel');
    budget.customStashes[0].balance = 500;
    const { budget: next, removed, error } = removeCustomStash(budget, stash.id);
    expect(error).toBeNull();
    expect(removed?.id).toBe(stash.id);
    expect(next.customStashes).toHaveLength(0);
    expect(next.looseMoneyBalance).toBe(1500);
  });

  it('reassigns resetUnspentStashId when the deleted stash was selected', () => {
    const first = addCustomStash({}, 'First');
    const second = addCustomStash(first.budget, 'Second');
    second.budget.resetUnspentStashId = first.stash.id;
    const { budget: next } = removeCustomStashWithDestination(second.budget, first.stash.id, {
      destination: 'looseCash',
    });
    expect(next.resetUnspentStashId).toBe(second.stash.id);
  });
});

describe('applyMonthEndRoute custom stash', () => {
  it('credits the configured resetUnspentStashId', () => {
    const { budget } = addCustomStash(
      { resetUnspentDestination: 'otherGoal' },
      'Renovation',
    );
    applyMonthEndRoute(budget, null, {
      destination: 'otherGoal',
      amount: 800,
      newRolloverBalance: 0,
    });
    const stash = getCustomStashById(budget, budget.resetUnspentStashId);
    expect(stash?.balance).toBe(800);
  });

  it('credits the only stash when resetUnspentStashId is missing', () => {
    const { budget, stash } = addCustomStash({}, 'Only one');
    delete budget.resetUnspentStashId;
    applyMonthEndRoute(budget, null, {
      destination: 'otherGoal',
      amount: 300,
      newRolloverBalance: 0,
    });
    expect(getCustomStashById(budget, stash.id)?.balance).toBe(300);
  });
});

describe('creditCustomStash', () => {
  it('returns false for unknown stash id', () => {
    const budget = {};
    expect(creditCustomStash(budget, 'missing', 100)).toBe(false);
  });
});

describe('isDuplicateStashName', () => {
  it('detects duplicates after normalization', () => {
    const { budget } = addCustomStash({}, 'Travel');
    expect(isDuplicateStashName(budget, '  travel ')).toBe(true);
  });

  it('ignores the excluded stash id when renaming', () => {
    const { budget, stash } = addCustomStash({}, 'Travel');
    expect(isDuplicateStashName(budget, 'Travel', stash.id)).toBe(false);
  });
});

describe('renameCustomStash', () => {
  it('updates the stash name', () => {
    const { budget, stash } = addCustomStash({}, 'Holiday');
    const { budget: next, stash: updated, error } = renameCustomStash(budget, stash.id, 'Summer trip');
    expect(error).toBeNull();
    expect(updated?.name).toBe('Summer trip');
    expect(getCustomStashById(next, stash.id)?.name).toBe('Summer trip');
  });

  it('rejects duplicate names', () => {
    const first = addCustomStash({}, 'Holiday');
    const second = addCustomStash(first.budget, 'Travel');
    const { error } = renameCustomStash(second.budget, second.stash.id, 'holiday');
    expect(error).toBe('duplicate');
  });

  it('returns unchanged when the name is the same', () => {
    const { budget, stash } = addCustomStash({}, 'Holiday');
    const { error } = renameCustomStash(budget, stash.id, 'Holiday');
    expect(error).toBe('unchanged');
  });
});

describe('updateCustomStash', () => {
  it('stores an optional description on create', () => {
    const { budget, stash, error } = addCustomStash({}, 'Holiday', 'Summer travel fund');
    expect(error).toBeNull();
    expect(stash?.description).toBe('Summer travel fund');
    expect(budget.customStashes[0].description).toBe('Summer travel fund');
  });

  it('creates tabs without description by default', () => {
    const { stash } = addCustomStash({}, 'Holiday');
    expect(stash?.description).toBeUndefined();
  });

  it('updates description and clears it when empty', () => {
    const { budget, stash } = addCustomStash({}, 'Holiday', 'Travel notes');
    const { budget: withDesc, error } = updateCustomStash(budget, stash.id, {
      name: 'Holiday',
      description: 'Updated note',
    });
    expect(error).toBeNull();
    expect(getCustomStashById(withDesc, stash.id)?.description).toBe('Updated note');

    const { budget: cleared } = updateCustomStash(withDesc, stash.id, {
      name: 'Holiday',
      description: '',
    });
    expect(getCustomStashById(cleared, stash.id)?.description).toBeUndefined();
  });
});
