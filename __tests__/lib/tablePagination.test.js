import { paginateItems, TABLE_PAGE_SIZES } from '../lib/tablePagination';

describe('tablePagination', () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1);

  it('exposes standard page sizes', () => {
    expect(TABLE_PAGE_SIZES).toEqual([5, 10, 20]);
  });

  it('returns first page slice', () => {
    const result = paginateItems(items, 0, 10);
    expect(result.pageItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.rangeStart).toBe(1);
    expect(result.rangeEnd).toBe(10);
    expect(result.pageCount).toBe(3);
  });

  it('clamps page index to last page', () => {
    const result = paginateItems(items, 99, 10);
    expect(result.pageIndex).toBe(2);
    expect(result.pageItems).toEqual([21, 22, 23]);
    expect(result.rangeStart).toBe(21);
    expect(result.rangeEnd).toBe(23);
  });

  it('handles empty lists', () => {
    const result = paginateItems([], 0, 10);
    expect(result.pageItems).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.rangeStart).toBe(0);
    expect(result.rangeEnd).toBe(0);
    expect(result.pageCount).toBe(1);
  });
});
