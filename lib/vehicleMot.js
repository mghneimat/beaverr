/** STK/MOT interval until next planned inspection (Czech rules). */
export const STK_YEARS_PASSENGER = 2;
export const STK_YEARS_MOTORCYCLE = 4;

/**
 * @param {string|null|undefined} category
 * @returns {number}
 */
export function stkIntervalYearsForCategory(category) {
  if (category === 'motorcycle') return STK_YEARS_MOTORCYCLE;
  return STK_YEARS_PASSENGER;
}

/**
 * @param {string} motDate - MM/YYYY or DD/MM/YYYY
 * @param {string|null|undefined} category
 * @param {(value: string, years: number, showDay: boolean) => string} addYears
 * @returns {string}
 */
export function calcMotNextDateFromExpiry(motDate, category, addYears) {
  if (!motDate) return '';
  return addYears(motDate, stkIntervalYearsForCategory(category), false);
}
