import { compactChildren } from '../../lib/compactChildren';

describe('compactChildren', () => {
  it('removes whitespace-only text nodes', () => {
    const result = compactChildren(['\n      ', 'hello', '   ']);
    expect(result).toEqual(['hello']);
  });

  it('preserves valid elements and filters null', () => {
    const a = <span key="a" />;
    const b = <span key="b" />;
    const result = compactChildren([a, null, b]);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('span');
    expect(result[1].type).toBe('span');
  });

  it('assigns keys to elements missing them', () => {
    const result = compactChildren([<span />, <span />]);
    expect(result[0].key).toBeTruthy();
    expect(result[1].key).toBeTruthy();
    expect(result[0].key).not.toBe(result[1].key);
  });
});
