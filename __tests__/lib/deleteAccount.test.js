jest.mock('../../lib/supabase.js', () => ({
  getSupabase: jest.fn(),
  isSupabaseConfigured: jest.fn(),
}));

import { mapDeleteAccountErrorKey } from '../../lib/auth/deleteAccount';

describe('mapDeleteAccountErrorKey', () => {
  const t = (key) => key;

  it('maps not configured code', () => {
    expect(mapDeleteAccountErrorKey('not_configured', 'missing', t)).toBe(
      'settings.deleteAccountNotConfigured',
    );
  });

  it('maps generic failure', () => {
    expect(mapDeleteAccountErrorKey('rpc_failed', 'permission denied', t)).toBe(
      'settings.deleteAccountFailed',
    );
  });
});
