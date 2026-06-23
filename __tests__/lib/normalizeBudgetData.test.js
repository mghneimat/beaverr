import { normalizeCostsByCategory, normalizeIncomePayload } from '../../lib/normalizeBudgetData';

describe('normalizeBudgetData', () => {
  it('normalizes malformed category items to arrays', () => {
    const rows = normalizeCostsByCategory([
      { category: 'housing', label: 'Housing', items: null },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].items).toEqual([]);
  });

  it('coerces object-shaped category list to empty', () => {
    expect(normalizeCostsByCategory({ 0: { category: 'housing', label: 'Housing', items: [] } })).toEqual([]);
  });

  it('normalizes otherIncomeRows on income payload', () => {
    expect(normalizeIncomePayload({ otherIncomeRows: { 0: { amount: 1 } } }).otherIncomeRows).toEqual([]);
  });
});
