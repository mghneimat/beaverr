import {
  parseStoredDate,
  formatDateDisplay,
  daysInMonth,
  buildStoredDateFromParts,
  buildTargetYearOptions,
  calcEndDateFromStartAndMonths,
  calcContractEndDate,
  mergeContractEndDateAuto,
  addYearsToStoredDate,
} from '../../lib/datePicker';

const t = (key) => {
  const months = {
    'common.months.june': 'June',
    'common.months.december': 'December',
  };
  return months[key] ?? key;
};

describe('parseStoredDate', () => {
  it('parses MM/YYYY when showDay is false', () => {
    expect(parseStoredDate('06/2028', false)).toEqual({
      day: null,
      month: 6,
      year: 2028,
    });
  });

  it('parses DD/MM/YYYY middle segments when showDay is false', () => {
    expect(parseStoredDate('15/06/2028', false)).toEqual({
      day: null,
      month: 6,
      year: 2028,
    });
  });
});

describe('daysInMonth', () => {
  it('returns correct days for February in leap year', () => {
    expect(daysInMonth(2, 2028)).toBe(29);
  });

  it('returns 31 for months with 31 days', () => {
    expect(daysInMonth(1, 2026)).toBe(31);
  });
});

describe('calcContractEndDate', () => {
  it('uses a 1-year contract term for standard payment frequencies', () => {
    expect(calcContractEndDate('01/06/2026', 'annual')).toBe('31/05/2027');
    expect(calcContractEndDate('01/06/2026', 'quarterly')).toBe('31/05/2027');
    expect(calcContractEndDate('01/06/2026', 'monthly')).toBe('31/05/2027');
  });

  it('uses custom months when frequency is custom', () => {
    expect(calcContractEndDate('15/01/2026', 'custom', '3')).toBe('14/04/2026');
  });
});

describe('mergeContractEndDateAuto', () => {
  it('auto-fills end date for fixed annual contract when start date is set', () => {
    const result = mergeContractEndDateAuto(
      { startDate: '01/06/2026', frequency: 'annual', endDateType: 'fixed' },
      { frequency: 'annual' },
    );
    expect(result.endDate).toBe('31/05/2027');
  });

  it('auto-fills a 1-year end date for fixed monthly contract when start date is set', () => {
    const result = mergeContractEndDateAuto(
      { startDate: '01/06/2026', frequency: 'monthly', endDateType: 'fixed' },
      { startDate: '01/06/2026' },
    );
    expect(result.endDate).toBe('31/05/2027');
  });

  it('skips auto end date when contract is ongoing and not custom', () => {
    const result = mergeContractEndDateAuto(
      { startDate: '01/06/2026', frequency: 'annual', endDateType: 'ongoing' },
      { frequency: 'quarterly' },
    );
    expect(result.endDate).toBeUndefined();
  });
});

describe('calcEndDateFromStartAndMonths', () => {
  it('returns end date one day before start + N months', () => {
    expect(calcEndDateFromStartAndMonths('15/01/2026', '12')).toBe('14/01/2027');
  });

  it('returns empty string for invalid input', () => {
    expect(calcEndDateFromStartAndMonths('', '12')).toBe('');
  });
});

describe('addYearsToStoredDate', () => {
  it('adds years to MM/YYYY dates', () => {
    expect(addYearsToStoredDate('06/2026', 2, false)).toBe('06/2028');
  });

  it('adds years to DD/MM/YYYY dates', () => {
    expect(addYearsToStoredDate('15/06/2026', 2, true)).toBe('15/06/2028');
  });

  it('returns empty string for invalid input', () => {
    expect(addYearsToStoredDate('', 2, false)).toBe('');
  });
});

describe('buildStoredDateFromParts', () => {
  it('builds MM/YYYY when showDay is false', () => {
    expect(buildStoredDateFromParts('', '6', '2028', {
      yearStart: 2026,
      yearEnd: 2030,
      showDay: false,
    })).toBe('06/2028');
  });

  it('returns null for month/year when month missing and showDay is false', () => {
    expect(buildStoredDateFromParts('', '', '2028', { showDay: false })).toBeNull();
  });

  it('builds DD/MM/YYYY when all parts valid', () => {
    expect(buildStoredDateFromParts('15', '6', '2028', { yearStart: 2026, yearEnd: 2030 }))
      .toBe('15/06/2028');
  });

  it('returns null for invalid day in month', () => {
    expect(buildStoredDateFromParts('31', '2', '2028', { yearStart: 2026, yearEnd: 2030 }))
      .toBeNull();
  });

  it('returns null when year incomplete', () => {
    expect(buildStoredDateFromParts('15', '6', '202', { yearStart: 2026, yearEnd: 2030 }))
      .toBeNull();
  });

  it('accepts typed years back to minYear when yearStart is 1900', () => {
    expect(buildStoredDateFromParts('15', '6', '1950', { yearStart: 1900, yearEnd: 2030 }))
      .toBe('15/06/1950');
  });
});

describe('buildTargetYearOptions', () => {
  const now = new Date(2026, 0, 1);

  it('lists years in ascending order with current year in the window', () => {
    const { options, yearStart, yearEnd, currentYear } = buildTargetYearOptions({
      now,
      yearEnd: 2056,
      pastYears: 5,
      futureYears: 5,
      minYear: 1900,
    });
    expect(options.map((o) => o.value)).toEqual([
      '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031',
    ]);
    expect(currentYear).toBe(2026);
    expect(yearStart).toBe(1900);
    expect(yearEnd).toBe(2056);
  });
});

describe('formatDateDisplay', () => {
  it('does not request common.months.undefined for month-only fields', () => {
    expect(formatDateDisplay('15/06/2028', false, t)).toBe('June 2028');
  });

  it('returns raw value when month is out of range', () => {
    expect(formatDateDisplay('99/2028', false, t)).toBe('99/2028');
  });
});
