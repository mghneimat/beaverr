import { groupGoalsForUiSections } from '../../lib/goals/goalCategories';

describe('groupGoalsForUiSections', () => {
  it('places debt goals in the debts section and savings in goals', () => {
    const savings = { id: 'g1', type: 'savings', name: 'Emergency' };
    const debt = { id: 'g2', type: 'debt', name: 'Credit card' };
    const reduce = { id: 'g3', type: 'reduceCosts', name: 'Trim spending' };

    const grouped = groupGoalsForUiSections([savings, debt, reduce]);

    expect(grouped.goals).toEqual([savings]);
    expect(grouped.debts).toEqual([debt]);
    expect(grouped.reduceCosts).toEqual([reduce]);
  });
});
