import {
  STK_YEARS_MOTORCYCLE,
  STK_YEARS_PASSENGER,
  calcMotNextDateFromExpiry,
  stkIntervalYearsForCategory,
} from '../../lib/vehicleMot';
import { addYearsToStoredDate } from '../../lib/datePicker';

describe('stkIntervalYearsForCategory', () => {
  it('uses 2 years for passenger vehicles', () => {
    expect(stkIntervalYearsForCategory('passenger')).toBe(STK_YEARS_PASSENGER);
  });

  it('uses 4 years for motorcycles and scooters', () => {
    expect(stkIntervalYearsForCategory('motorcycle')).toBe(STK_YEARS_MOTORCYCLE);
  });

  it('defaults to passenger interval for unknown categories', () => {
    expect(stkIntervalYearsForCategory('bicycle')).toBe(STK_YEARS_PASSENGER);
  });
});

describe('calcMotNextDateFromExpiry', () => {
  it('adds 2 years for cars', () => {
    expect(calcMotNextDateFromExpiry('05/2027', 'passenger', addYearsToStoredDate)).toBe('05/2029');
  });

  it('adds 4 years for motorcycles', () => {
    expect(calcMotNextDateFromExpiry('05/2027', 'motorcycle', addYearsToStoredDate)).toBe('05/2031');
  });

  it('returns empty when expiry is cleared', () => {
    expect(calcMotNextDateFromExpiry('', 'motorcycle', addYearsToStoredDate)).toBe('');
  });
});
