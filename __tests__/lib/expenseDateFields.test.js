import {
  appendOptionalPaymentDateFields,
  mergePrefixedPaymentDates,
  normalizePaymentDates,
  parseChargeDay,
  pickPrefixedPaymentDates,
  resolveRowPaymentDates,
} from '../../lib/expenseDateFields';

describe('expenseDateFields', () => {
  test('parseChargeDay accepts 1–31 only', () => {
    expect(parseChargeDay('15')).toBe(15);
    expect(parseChargeDay(1)).toBe(1);
    expect(parseChargeDay('0')).toBeNull();
    expect(parseChargeDay('32')).toBeNull();
    expect(parseChargeDay('')).toBeNull();
  });

  test('normalizePaymentDates trims strings and parses charge day', () => {
    expect(normalizePaymentDates({
      endDate: ' 2026-12-01 ',
      dueDate: '',
      chargeDay: '12',
    })).toEqual({
      endDate: '2026-12-01',
      dueDate: null,
      chargeDay: 12,
    });
  });

  test('pickPrefixedPaymentDates prefers prefixed keys', () => {
    expect(pickPrefixedPaymentDates({
      foodEndDate: '2026-06-01',
      endDate: '2026-01-01',
      foodChargeDay: 5,
    }, 'food')).toEqual({
      endDate: '2026-06-01',
      dueDate: null,
      chargeDay: 5,
    });
  });

  test('appendOptionalPaymentDateFields skips aliases already on form', () => {
    const fields = [
      { type: 'date', key: 'promoEndDate', labelKey: 'x' },
      { type: 'number', key: 'paymentDueDay', labelKey: 'y' },
    ];
    const appended = appendOptionalPaymentDateFields(fields);
    expect(appended.some((f) => f.key === 'endDate')).toBe(false);
    expect(appended.some((f) => f.key === 'chargeDay')).toBe(false);
    expect(appended.some((f) => f.key === 'dueDate')).toBe(true);
  });

  test('resolveRowPaymentDates for child cost reads field source', () => {
    expect(resolveRowPaymentDates({
      editKind: 'child_cost',
      source: { field: { endDate: '2026-03-01', chargeDay: 10 } },
    })).toEqual({
      endDate: '2026-03-01',
      dueDate: null,
      chargeDay: 10,
    });
  });

  test('mergePrefixedPaymentDates writes prefixed storage keys', () => {
    expect(mergePrefixedPaymentDates({ rent: 15000 }, 'rent', {
      endDate: '2027-01-01',
      dueDate: '2026-07-01',
      chargeDay: 3,
    })).toEqual({
      rent: 15000,
      rentEndDate: '2027-01-01',
      rentDueDate: '2026-07-01',
      rentChargeDay: 3,
    });
  });
});
