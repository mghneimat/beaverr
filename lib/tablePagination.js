/** @type {readonly number[]} */
export const TABLE_PAGE_SIZES = [5, 10, 20];

/**
 * @param {readonly T[]|T[]} items
 * @param {number} pageIndex
 * @param {number} pageSize
 * @returns {{
 *   pageIndex: number,
 *   pageCount: number,
 *   pageItems: T[],
 *   total: number,
 *   rangeStart: number,
 *   rangeEnd: number,
 * }}
 * @template T
 */
export function paginateItems(items, pageIndex, pageSize) {
  const list = Array.isArray(items) ? items : [];
  const total = list.length;
  const size = Math.max(1, Number(pageSize) || 10);
  const pageCount = Math.max(1, Math.ceil(total / size));
  const safeIndex = Math.min(Math.max(0, Number(pageIndex) || 0), pageCount - 1);
  const start = safeIndex * size;

  return {
    pageIndex: safeIndex,
    pageCount,
    pageItems: list.slice(start, start + size),
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + size, total),
  };
}
