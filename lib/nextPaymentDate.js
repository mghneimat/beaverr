/**
 * Compute next payment date from charge day and frequency.
 * Dates returned as DD/MM/YYYY.
 */

/**
 * @param {number} day - 1-31
 * @param {number} month - 0-11
 * @param {number} year
 * @returns {Date}
 */
function safeDate(year, month, day) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

/**
 * @param {Date} d
 * @returns {string} DD/MM/YYYY
 */
export function formatDateDMY(d) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

/**
 * Parse DD/MM/YYYY or partial — returns Date or null
 * @param {string} value
 * @returns {Date|null}
 */
export function parseDMY(value) {
  if (!value || typeof value !== 'string') return null;
  const parts = value.split('/').map((p) => p.trim());
  if (parts.length < 2) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
  if (Number.isNaN(day) || Number.isNaN(month) || day < 1 || month < 0) return null;
  return safeDate(year, month, day);
}

/**
 * @param {object} params
 * @param {string|number} params.chargeDay - day of month 1-31
 * @param {'monthly'|'quarterly'|'annual'} params.frequency
 * @param {string} [params.endDate] - DD/MM/YYYY anchor for annual when set
 * @param {Date} [params.fromDate]
 * @returns {string|null} DD/MM/YYYY
 */
export function computeNextPaymentDate({ chargeDay, frequency, fromDate = new Date() }) {
  const day = parseInt(String(chargeDay), 10);
  if (!day || day < 1 || day > 31) return null;

  const today = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());

  if (frequency === 'annual') {
    let candidate = safeDate(today.getFullYear(), today.getMonth(), day);
    if (candidate <= today) {
      candidate = safeDate(today.getFullYear() + 1, today.getMonth(), day);
    }
    return formatDateDMY(candidate);
  }

  if (frequency === 'quarterly') {
    let candidate = safeDate(today.getFullYear(), today.getMonth(), day);
    while (candidate <= today) {
      candidate = safeDate(candidate.getFullYear(), candidate.getMonth() + 3, day);
    }
    return formatDateDMY(candidate);
  }

  // monthly
  let candidate = safeDate(today.getFullYear(), today.getMonth(), day);
  if (candidate <= today) {
    candidate = safeDate(today.getFullYear(), today.getMonth() + 1, day);
  }
  return formatDateDMY(candidate);
}
