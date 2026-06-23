import { buildBudgetExportRows } from '../../lib/budgetExportRows';

describe('buildBudgetExportRows', () => {
  it('handles malformed costsByCategory and cat.items without throwing', () => {
    const rows = buildBudgetExportRows({
      summaryRows: [
        { key: 'income', label: 'Income', amount: 1000 },
        { key: 'fixedCosts', label: 'Fixed', amount: -200 },
      ],
      incomeBreakdown: [{ label: 'Salary', amount: 1000 }],
      costsByCategory: {
        0: { label: 'Housing', items: null },
      },
      totalBudget: 800,
      currency: 'CZK',
      totalLabel: 'Budget',
    });

    expect(rows.some((r) => r.level === 'total')).toBe(true);
    expect(rows.filter((r) => r.level === 'category')).toHaveLength(0);
  });

  it('exports category rows when items are a proper array', () => {
    const rows = buildBudgetExportRows({
      summaryRows: [{ key: 'fixedCosts', label: 'Fixed', amount: -200 }],
      incomeBreakdown: [],
      costsByCategory: [{ label: 'Housing', items: [{ label: 'Rent', amount: 200 }] }],
      totalBudget: 800,
      currency: 'CZK',
      totalLabel: 'Budget',
    });

    expect(rows.filter((r) => r.level === 'category')).toHaveLength(1);
    expect(rows.filter((r) => r.level === 'item')).toHaveLength(1);
  });
});
