import { buildSupabaseRestHeaders, normalizeSupabaseKey } from '../../lib/supabaseRest';

describe('supabaseRest', () => {
  it('sets apikey and matching Authorization bearer for publishable keys', () => {
    const key = 'sb_publishable_example';
    expect(buildSupabaseRestHeaders(key)).toEqual({
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    });
  });

  it('strips angle brackets from pasted keys', () => {
    expect(normalizeSupabaseKey('<sb_publishable_abc>')).toBe('sb_publishable_abc');
    expect(normalizeSupabaseKey('  eyJhbG  ')).toBe('eyJhbG');
  });
});
