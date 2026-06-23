const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * End date from start date + months, minus 1 day. Returns DD/MM/YYYY or ''.
 * @param {string} startDate DD/MM/YYYY
 * @param {string|number} months
 * @returns {string}
 */
export function calcEndDateFromStartAndMonths(startDate, months) {
  if (!startDate || !months) return '';
  const parts = startDate.split('/');
  if (parts.length !== 3) return '';
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  const numMonths = parseInt(months, 10);
  if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y) || Number.isNaN(numMonths) || numMonths <= 0) {
    return '';
  }
  const end = new Date(y, m - 1 + numMonths, d - 1);
  return `${pad2(end.getDate())}/${pad2(end.getMonth() + 1)}/${end.getFullYear()}`;
}

/**
 * Standard insurance contract term (months) for auto end-date — not payment cadence.
 * Monthly/quarterly/annual premiums share a typical 1-year policy term.
 * @param {string} frequency
 * @returns {number|null}
 */
export function contractTermMonthsForFrequency(frequency) {
  switch (frequency) {
    case 'monthly':
    case 'quarterly':
    case 'annual':
      return 12;
    default:
      return null;
  }
}

/** @deprecated Use contractTermMonthsForFrequency — kept for callers expecting payment cadence months */
export function monthsForStandardFrequency(frequency) {
  return contractTermMonthsForFrequency(frequency);
}

/**
 * Auto end date from start + frequency (standard or custom months).
 * @param {string} startDate DD/MM/YYYY
 * @param {string} frequency
 * @param {string|number} [customMonths]
 * @returns {string}
 */
export function calcContractEndDate(startDate, frequency, customMonths) {
  if (!startDate) return '';
  const months = frequency === 'custom'
    ? parseInt(customMonths, 10)
    : contractTermMonthsForFrequency(frequency);
  if (!months || Number.isNaN(months)) return '';
  return calcEndDateFromStartAndMonths(startDate, months);
}

/**
 * Add whole calendar years to a stored date string.
 * @param {string} value DD/MM/YYYY or MM/YYYY
 * @param {number} years
 * @param {boolean} [showDay=true]
 * @returns {string}
 */
export function addYearsToStoredDate(value, years, showDay = true) {
  if (!value || years == null) return '';
  const numYears = parseInt(years, 10);
  if (Number.isNaN(numYears)) return '';
  const { day, month, year } = parseStoredDate(value, showDay);
  if (!month || !year) return '';
  return formatStoredDate(
    { day: showDay ? day : null, month, year: year + numYears },
    showDay,
  );
}

/**
 * Merge partial contract updates with an auto-calculated end date when applicable.
 * @param {Object} data - Current contract field values
 * @param {Object} partial - Incoming updates
 * @returns {Object}
 */
export function mergeContractEndDateAuto(data, partial) {
  const next = { ...data, ...partial };
  if (!next.startDate) return partial;
  if (next.frequency !== 'custom' && next.endDateType !== 'fixed') return partial;

  const endDate = calcContractEndDate(
    next.startDate,
    next.frequency,
    next.customFrequencyMonths,
  );
  if (endDate) return { ...partial, endDate };
  return partial;
}

/**
 * @param {string} value
 * @param {boolean} showDay
 * @returns {{ day: number|null, month: number|null, year: number|null }}
 */
export function parseStoredDate(value, showDay = true) {
  if (!value) return { day: null, month: null, year: null };
  const parts = value.split('/');
  if (showDay && parts.length === 3) {
    return {
      day: parseInt(parts[0], 10) || null,
      month: parseInt(parts[1], 10) || null,
      year: parseInt(parts[2], 10) || null,
    };
  }
  if (!showDay && parts.length === 3) {
    return {
      day: null,
      month: parseInt(parts[1], 10) || null,
      year: parseInt(parts[2], 10) || null,
    };
  }
  if (parts.length >= 2) {
    return {
      day: null,
      month: parseInt(parts[0], 10) || null,
      year: parseInt(parts[1], 10) || null,
    };
  }
  return { day: null, month: null, year: null };
}

function monthKey(month) {
  if (!month || month < 1 || month > 12) return null;
  return MONTH_KEYS[month - 1] ?? null;
}

/**
 * @param {number|null|undefined} month 1–12
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function getMonthLabel(month, t) {
  const key = monthKey(month);
  return key ? t(`common.monthsShort.${key}`) : '';
}

/**
 * @param {(key: string) => string} t
 * @returns {Array<{ value: string, label: string }>}
 */
export function getMonthOptions(t) {
  return MONTH_KEYS.map((key, idx) => ({
    value: String(idx + 1),
    label: t(`common.monthsShort.${key}`),
  }));
}

/**
 * Target-date year list — current year, a short future window, then recent past in list only.
 * Validation yearEnd can extend further for typed years; minYear default 1900 for typed past.
 * @param {{ yearEnd?: number, pastYears?: number, futureYears?: number, minYear?: number, now?: Date }} [opts]
 * @returns {{ options: Array<{ value: string, label: string }>, yearStart: number, yearEnd: number, currentYear: number }}
 */
export function buildTargetYearOptions(opts = {}) {
  const now = opts.now ?? new Date();
  const currentYear = now.getFullYear();
  const endYear = opts.yearEnd ?? currentYear + 30;
  const pastYears = opts.pastYears ?? 5;
  const futureYears = opts.futureYears ?? 5;
  const minYear = opts.minYear ?? 1900;
  const listFutureEnd = Math.min(endYear, currentYear + futureYears);
  const listPastStart = currentYear - pastYears;
  const options = [];

  for (let y = listPastStart; y <= listFutureEnd; y += 1) {
    options.push({ value: String(y), label: String(y) });
  }

  return { options, yearStart: minYear, yearEnd: endYear, currentYear };
}

/**
 * @param {{ day?: number|null, month?: number|null, year?: number|null }} parts
 * @param {boolean} showDay
 * @returns {string}
 */
export function formatStoredDate({ day, month, year }, showDay = true) {
  if (!month || !year) return '';
  if (showDay) {
    const d = day ? pad2(day) : '';
    return `${d}/${pad2(month)}/${year}`;
  }
  return `${pad2(month)}/${year}`;
}

/**
 * @param {number} month 1–12
 * @param {number} year
 * @returns {number}
 */
export function daysInMonth(month, year) {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (!m || m < 1 || m > 12 || !y) return 31;
  return new Date(y, m, 0).getDate();
}

/**
 * Build DD/MM/YYYY from separate field strings; null if incomplete or invalid.
 * @param {string} dayStr
 * @param {string} monthStr
 * @param {string} yearStr
 * @param {{ yearStart?: number, yearEnd?: number }} [opts]
 * @returns {string|null}
 */
export function buildStoredDateFromParts(dayStr, monthStr, yearStr, opts = {}) {
  const showDay = opts.showDay ?? true;
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  const currentYear = new Date().getFullYear();
  const yearStart = opts.yearStart ?? currentYear;
  const yearEnd = opts.yearEnd ?? currentYear + 30;

  if (!monthStr?.trim() || !yearStr?.trim()) return null;
  if (month < 1 || month > 12) return null;
  if (yearStr.length < 4 || year < yearStart || year > yearEnd) return null;

  if (!showDay) {
    return formatStoredDate({ day: null, month, year }, false);
  }

  const day = parseInt(dayStr, 10);
  if (!dayStr?.trim()) return null;
  if (day < 1 || day > daysInMonth(month, year)) return null;

  return formatStoredDate({ day, month, year }, true);
}

/**
 * @param {string} value
 * @param {boolean} showDay
 * @param {(key: string) => string} t
 */
export function formatDateDisplay(value, showDay, t) {
  const { day, month, year } = parseStoredDate(value, showDay);
  const key = monthKey(month);
  if (!key || !year) return value || '';
  const monthName = t(`common.months.${key}`);
  if (showDay && day) return `${pad2(day)} ${monthName} ${year}`;
  return `${monthName} ${year}`;
}

/**
 * Resolve month number from typed prefix (name or number).
 * @param {string} token
 * @param {(key: string) => string} t
 * @returns {number|null}
 */
export function resolveMonthPart(token, t) {
  return resolveMonthToken(token, t);
}

function resolveMonthToken(token, t) {
  const trimmed = token.trim().toLowerCase();
  if (!trimmed) return null;
  const asNum = parseInt(trimmed, 10);
  if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= 12) return asNum;
  for (let i = 0; i < MONTH_KEYS.length; i++) {
    const name = t(`common.months.${MONTH_KEYS[i]}`).toLowerCase();
    const short = t(`common.monthsShort.${MONTH_KEYS[i]}`).toLowerCase();
    if (
      name.startsWith(trimmed) ||
      name.includes(trimmed) ||
      short.startsWith(trimmed) ||
      short.includes(trimmed)
    ) {
      return i + 1;
    }
  }
  return null;
}

/**
 * Parse free-form user input into canonical stored date string.
 * @param {string} input
 * @param {boolean} showDay
 * @param {(key: string) => string} t
 * @returns {string|null}
 */
export function parseLooseDate(input, showDay, t) {
  if (!input?.trim()) return null;
  const s = input.trim();

  if (showDay) {
    const full = s.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{4})$/);
    if (full) {
      const day = parseInt(full[1], 10);
      const month = parseInt(full[2], 10);
      const year = parseInt(full[3], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return formatStoredDate({ day, month, year }, true);
      }
    }
  }

  const monthYear = s.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{4})$/);
  if (monthYear && !showDay) {
    const month = parseInt(monthYear[1], 10);
    const year = parseInt(monthYear[2], 10);
    if (month >= 1 && month <= 12) return formatStoredDate({ month, year }, false);
  }

  const nameYear = s.match(/^([a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+)\s+(\d{4})$/i);
  if (nameYear) {
    const month = resolveMonthToken(nameYear[1], t);
    const year = parseInt(nameYear[2], 10);
    if (month) return formatStoredDate({ day: showDay ? 1 : null, month, year }, showDay);
  }

  const monthOnly = resolveMonthToken(s, t);
  if (monthOnly) {
    const year = new Date().getFullYear();
    return formatStoredDate({ day: showDay ? 1 : null, month: monthOnly, year }, showDay);
  }

  return null;
}

/**
 * @param {Object} opts
 * @param {string} opts.query
 * @param {boolean} opts.showDay
 * @param {number} opts.yearStart
 * @param {number} opts.yearEnd
 * @param {(key: string) => string} opts.t
 * @returns {Array<{ label: string, value: string }>}
 */
export function buildDateSuggestions({ query, showDay, yearStart, yearEnd, t }) {
  const q = (query || '').trim().toLowerCase();
  const now = new Date();
  const currentYear = now.getFullYear();
  const seen = new Set();
  const results = [];

  const push = (label, value) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    results.push({ label, value });
  };

  // Month name + upcoming years
  MONTH_KEYS.forEach((key, idx) => {
    const monthNum = idx + 1;
    const monthName = t(`common.months.${key}`);
    const monthLower = monthName.toLowerCase();
    if (q && !monthLower.startsWith(q) && !monthLower.includes(q) && !String(monthNum).startsWith(q)) {
      return;
    }
    for (let y = Math.max(yearStart, currentYear); y <= yearEnd && results.length < 12; y++) {
      push(
        showDay ? `${monthName} ${y}` : `${monthName} ${y}`,
        formatStoredDate({ day: showDay ? 1 : null, month: monthNum, year: y }, showDay),
      );
    }
  });

  // Numeric MM/YYYY or partial year completion
  const numericMY = q.match(/^(\d{1,2})\s*[\/\-.]?\s*(\d{0,4})$/);
  if (numericMY && !showDay) {
    const month = parseInt(numericMY[1], 10);
    const yearPart = numericMY[2];
    if (month >= 1 && month <= 12) {
      if (yearPart && yearPart.length === 4) {
        push(
          `${pad2(month)}/${yearPart}`,
          formatStoredDate({ month, year: parseInt(yearPart, 10) }, false),
        );
      } else {
        const prefix = yearPart || String(currentYear);
        for (let y = yearStart; y <= yearEnd && results.length < 8; y++) {
          if (String(y).startsWith(prefix)) {
            push(`${pad2(month)}/${y}`, formatStoredDate({ month, year: y }, false));
          }
        }
      }
    }
  }

  // DD/MM/YYYY numeric
  const numericFull = q.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]?\s*(\d{0,4})$/);
  if (numericFull && showDay) {
    const day = parseInt(numericFull[1], 10);
    const month = parseInt(numericFull[2], 10);
    const yearPart = numericFull[3];
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      if (yearPart && yearPart.length === 4) {
        push(
          `${pad2(day)}/${pad2(month)}/${yearPart}`,
          formatStoredDate({ day, month, year: parseInt(yearPart, 10) }, true),
        );
      } else {
        const prefix = yearPart || String(currentYear);
        for (let y = yearStart; y <= yearEnd && results.length < 8; y++) {
          if (String(y).startsWith(prefix)) {
            push(
              `${pad2(day)}/${pad2(month)}/${y}`,
              formatStoredDate({ day, month, year: y }, true),
            );
          }
        }
      }
    }
  }

  // Year-only tail: "06/202" -> complete years
  const yearTail = q.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{1,3})$/);
  if (yearTail && !showDay && results.length < 8) {
    const month = parseInt(yearTail[1], 10);
    const prefix = yearTail[2];
    if (month >= 1 && month <= 12) {
      for (let y = yearStart; y <= yearEnd; y++) {
        if (String(y).startsWith(prefix)) {
          push(`${pad2(month)}/${y}`, formatStoredDate({ month, year: y }, false));
        }
      }
    }
  }

  return results.slice(0, 6);
}
