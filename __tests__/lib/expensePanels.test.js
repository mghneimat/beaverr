import {
  buildRecurringExpensePanels,
  buildExpenseSectionGroups,
} from '../../lib/expensePanels';

const t = (key) => {
  if (key.startsWith('onboarding.otherCosts.costSelection.costs.')) {
    return key.split('.').pop();
  }
  if (key.startsWith('onboarding.budget.budgetSplit.cat.')) {
    return key.split('.').pop();
  }
  if (key.startsWith('dashboard.expensesScreen.subtabs.')) {
    return key.split('.').pop();
  }
  return key;
};

describe('buildExpenseSectionGroups other costs', () => {
  it('groups groceries separately from other everyday costs', () => {
    const sections = {
      otherCosts: [
        { name: 'groceries', amount: 8000, frequency: 'monthly' },
        { name: 'hairSalon', amount: 400, frequency: 'monthly' },
      ],
    };
    const panels = buildRecurringExpensePanels(sections, [], null, t);
    const sectionsGrouped = buildExpenseSectionGroups(panels, t);

    const groceries = sectionsGrouped.find((s) => s.key === 'groceries');
    const other = sectionsGrouped.find((s) => s.key === 'other');

    expect(groceries?.items).toHaveLength(1);
    expect(groceries?.items[0].label).toBe('groceries');
    expect(other?.items).toHaveLength(1);
    expect(other?.items[0].label).toBe('hairSalon');
  });
});
