import { buildSupabaseRestHeaders } from '../../lib/supabaseRest';
import { signUpViaRest, signInViaRest } from '../../lib/auth/authRest';

describe('authRest', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_test_key';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('signUpViaRest uses apikey headers for publishable keys', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 'u1', identities: [{}] } }),
    });

    const result = await signUpViaRest('user@example.com', 'TestPass1', { locale: 'en' });

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/signup',
      expect.objectContaining({
        method: 'POST',
        headers: buildSupabaseRestHeaders('sb_publishable_test_key'),
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'TestPass1',
          data: { locale: 'en' },
        }),
      }),
    );
  });

  it('signInViaRest posts to token endpoint', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'a', refresh_token: 'r' }),
    });

    const result = await signInViaRest('user@example.com', 'TestPass1');

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/token?grant_type=password',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
