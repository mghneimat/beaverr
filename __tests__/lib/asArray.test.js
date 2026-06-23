import { asArray } from '../../lib/asArray';

describe('asArray', () => {
  it('returns arrays unchanged', () => {
    const input = [{ id: 1 }];
    expect(asArray(input)).toBe(input);
  });

  it('coerces null, undefined, objects, and primitives to []', () => {
    expect(asArray(null)).toEqual([]);
    expect(asArray(undefined)).toEqual([]);
    expect(asArray({ 0: 'a' })).toEqual([]);
    expect(asArray('pets')).toEqual([]);
  });
});
