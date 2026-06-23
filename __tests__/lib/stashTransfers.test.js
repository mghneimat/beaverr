import { addCustomStash } from '../../lib/customStashes';
import {
  getStashBalance,
  transferBetweenStashes,
  removeCustomStashWithDestination,
} from '../../lib/stashTransfers';

describe('getStashBalance', () => {
  it('reads piggy bank, savings, and custom stash balances', () => {
    const { budget } = addCustomStash({ looseMoneyBalance: 1000 }, 'Holiday');
    budget.customStashes[0].balance = 250;
    expect(getStashBalance(budget, { savingsBalance: 500 }, 'looseCash')).toBe(1000);
    expect(getStashBalance(budget, { savingsBalance: 500 }, 'savings')).toBe(500);
    expect(getStashBalance(budget, null, `stash:${budget.customStashes[0].id}`)).toBe(250);
  });
});

describe('transferBetweenStashes', () => {
  it('moves money from piggy bank to savings', () => {
    const budget = { looseMoneyBalance: 1000 };
    const income = { savingsBalance: 200 };
    const { budget: nextBudget, income: nextIncome, error } = transferBetweenStashes(
      budget,
      income,
      'looseCash',
      'savings',
      300,
    );
    expect(error).toBeNull();
    expect(nextBudget.looseMoneyBalance).toBe(700);
    expect(nextIncome.savingsBalance).toBe(500);
  });

  it('moves money between custom stashes', () => {
    const first = addCustomStash({}, 'Gifts');
    const second = addCustomStash(first.budget, 'Travel');
    first.budget.customStashes[0].balance = 400;
    const fromRef = `stash:${first.budget.customStashes[0].id}`;
    const toRef = `stash:${second.stash.id}`;
    const { budget, error } = transferBetweenStashes(
      first.budget,
      {},
      fromRef,
      toRef,
      150,
    );
    expect(error).toBeNull();
    expect(getStashBalance(budget, {}, fromRef)).toBe(250);
    expect(getStashBalance(budget, {}, toRef)).toBe(150);
  });

  it('rejects transfers above the source balance', () => {
    const budget = { looseMoneyBalance: 100 };
    const { error } = transferBetweenStashes(budget, {}, 'looseCash', 'savings', 200);
    expect(error).toBe('insufficient');
  });
});

describe('removeCustomStashWithDestination', () => {
  it('routes balance to savings when deleting', () => {
    const { budget, stash } = addCustomStash({}, 'Holiday');
    budget.customStashes[0].balance = 600;
    const income = { savingsBalance: 100 };
    const { budget: nextBudget, income: nextIncome, error } = removeCustomStashWithDestination(
      budget,
      stash.id,
      { income, destination: 'savings' },
    );
    expect(error).toBeNull();
    expect(nextBudget.customStashes).toHaveLength(0);
    expect(nextIncome.savingsBalance).toBe(700);
  });

  it('routes balance to another custom tab when deleting', () => {
    const first = addCustomStash({}, 'Gifts');
    const second = addCustomStash(first.budget, 'Travel');
    first.budget.customStashes[0].balance = 300;
    const { budget, error } = removeCustomStashWithDestination(
      first.budget,
      first.stash.id,
      { destination: `stash:${second.stash.id}` },
    );
    expect(error).toBeNull();
    expect(budget.customStashes).toHaveLength(1);
    expect(budget.customStashes[0].balance).toBe(300);
  });
});
