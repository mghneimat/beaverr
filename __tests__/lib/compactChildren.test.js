import { compactChildren } from '../../lib/compactChildren';

describe('compactChildren', () => {
  it('removes whitespace-only text nodes', () => {
    const result = compactChildren(['\n      ', 'hello', '   ']);
    expect(result).toEqual(['hello']);
  });

  it('preserves valid elements and filters null', () => {
    const a = { type: 'a', key: 'a' };
    const b = { type: 'b', key: 'b' };
    expect(compactChildren([a, null, b])).toEqual([a, b]);
  });

  it('assigns keys to elements missing them', () => {
    const result = compactChildren([<span />, <span />]);
    expect(result[0].key).toBe('compact-0');
    expect(result[1].key).toBe('compact-1');
  });
});
