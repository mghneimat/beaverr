import {
  ensureVisibleContributionRow,
  loadContributionRowsFromSaved,
} from '../../lib/housing/contributionRows';

describe('contributionRows', () => {
  test('ensureVisibleContributionRow seeds a row when empty', () => {
    const nextId = { current: 1 };
    const rows = ensureVisibleContributionRow([], nextId);
    expect(rows).toHaveLength(1);
    expect(rows[0].visible).toBe(true);
    expect(nextId.current).toBe(2);
  });

  test('loadContributionRowsFromSaved seeds when enabled and saved empty', () => {
    const nextId = { current: 0 };
    const rows = loadContributionRowsFromSaved([], true, nextId);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe('');
  });

  test('loadContributionRowsFromSaved maps saved rows', () => {
    const nextId = { current: 0 };
    const rows = loadContributionRowsFromSaved(
      [{ amount: 100, description: 'Rent share', dueDate: '' }],
      true,
      nextId,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe('100');
    expect(rows[0].description).toBe('Rent share');
  });
});
