import { parseStoredDate } from './datePicker';

/**
 * @param {string} stored - DD/MM/YYYY
 * @returns {string|null} YYYY-MM-DD
 */
export function storedDateToIso(stored) {
  const parsed = parseStoredDate(stored, true);
  if (!parsed.day || !parsed.month || !parsed.year) return null;
  const m = String(parsed.month).padStart(2, '0');
  const d = String(parsed.day).padStart(2, '0');
  return `${parsed.year}-${m}-${d}`;
}

/**
 * @param {string} iso - YYYY-MM-DD
 * @returns {string} DD/MM/YYYY
 */
export function isoToStoredDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${Number(d)}/${Number(m)}/${y}`;
}
