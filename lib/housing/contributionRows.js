/**
 * Ensure at least one visible contribution/cost row exists for toggle-reveal forms.
 * @param {Array<{ id: number, visible?: boolean }>} rows
 * @param {React.MutableRefObject<number>} nextIdRef
 * @returns {Array<{ id: number, amount: string, description: string, dueDate: string, visible: boolean }>}
 */
export function ensureVisibleContributionRow(rows, nextIdRef) {
  const visible = rows.filter((r) => r.visible !== false);
  if (visible.length > 0) return rows;

  const id = nextIdRef.current++;
  return [{ id, amount: '', description: '', dueDate: '', visible: true }];
}

/**
 * @param {Array<unknown>|null|undefined} savedRows
 * @param {boolean} enabled
 * @param {React.MutableRefObject<number>} nextIdRef
 * @returns {Array<{ id: number, amount: string, description: string, dueDate: string, visible: boolean }>}
 */
export function loadContributionRowsFromSaved(savedRows, enabled, nextIdRef) {
  if (!enabled) {
    return [{ id: 0, amount: '', description: '', dueDate: '', visible: true }];
  }

  if (Array.isArray(savedRows) && savedRows.length > 0) {
    const mapped = savedRows.map((r, i) => ({
      ...r,
      id: i,
      amount: r.amount != null ? String(r.amount) : '',
      description: r.description || '',
      dueDate: r.dueDate || '',
      visible: true,
    }));
    nextIdRef.current = mapped.length;
    return mapped;
  }

  return [{ id: 0, amount: '', description: '', dueDate: '', visible: true }];
}
