import { invokeAdminApi, checkAdminAccess } from '../../lib/admin/adminApi';

const mockFetchIsAdmin = jest.fn();
const mockInvoke = jest.fn();
const mockGetSupabase = jest.fn();

jest.mock('../../lib/admin/isAdmin.js', () => ({
  fetchIsAdmin: (...args) => mockFetchIsAdmin(...args),
}));

jest.mock('../../lib/supabase.js', () => ({
  getSupabase: () => mockGetSupabase(),
}));

describe('adminApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabase.mockReturnValue({
      functions: { invoke: mockInvoke },
    });
  });

  describe('checkAdminAccess', () => {
    it('returns isAdmin false for non-admin users', async () => {
      mockFetchIsAdmin.mockResolvedValue(false);

      const result = await checkAdminAccess();

      expect(result).toEqual({ ok: true, isAdmin: false });
    });

    it('returns isAdmin true for admin users', async () => {
      mockFetchIsAdmin.mockResolvedValue(true);

      const result = await checkAdminAccess();

      expect(result).toEqual({ ok: true, isAdmin: true });
    });
  });

  describe('invokeAdminApi', () => {
    it('maps forbidden edge response to forbidden error', async () => {
      mockInvoke.mockResolvedValue({ data: { error: 'forbidden' }, error: null });

      const result = await invokeAdminApi('users.detail', { user_id: 'other-user' });

      expect(result).toEqual({ ok: false, error: 'forbidden' });
    });

    it('returns data on success', async () => {
      mockInvoke.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

      const result = await invokeAdminApi('users.detail', { user_id: 'u1' });

      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ user: { id: 'u1' } });
    });
  });
});
