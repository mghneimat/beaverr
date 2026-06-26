import { deleteAccountAndData } from '../../lib/account/deleteAccountAndData';

const mockDeleteOwnSupabaseAccount = jest.fn();
const mockGetSupabase = jest.fn();
const mockIsSupabaseConfigured = jest.fn(() => true);
const mockClearAllData = jest.fn(() => Promise.resolve());
const mockRemoveData = jest.fn(() => Promise.resolve());

jest.mock('../../lib/auth/deleteAccount.js', () => ({
  deleteOwnSupabaseAccount: (...args) => mockDeleteOwnSupabaseAccount(...args),
}));

jest.mock('../../lib/cloud/syncHousehold.js', () => ({
  clearScheduledCloudPush: jest.fn(),
}));

jest.mock('../../lib/supabase.js', () => ({
  isSupabaseConfigured: () => mockIsSupabaseConfigured(),
  getSupabase: () => mockGetSupabase(),
}));

jest.mock('../../lib/storage.js', () => ({
  clearAllData: (...args) => mockClearAllData(...args),
  removeData: (...args) => mockRemoveData(...args),
}));

describe('deleteAccountAndData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteOwnSupabaseAccount.mockResolvedValue({ ok: true });
    mockIsSupabaseConfigured.mockReturnValue(true);
    mockGetSupabase.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }),
        signOut: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('deletes remote account then clears local data', async () => {
    const result = await deleteAccountAndData();

    expect(result.ok).toBe(true);
    expect(mockDeleteOwnSupabaseAccount).toHaveBeenCalled();
    expect(mockClearAllData).toHaveBeenCalled();
  });

  it('returns error when remote delete fails', async () => {
    mockDeleteOwnSupabaseAccount.mockResolvedValue({
      ok: false,
      error: 'rpc_failed',
      code: 'not_configured',
    });

    const result = await deleteAccountAndData();

    expect(result.ok).toBe(false);
    expect(result.code).toBe('not_configured');
    expect(mockClearAllData).not.toHaveBeenCalled();
  });

  it('skips remote delete when Supabase is not configured', async () => {
    mockIsSupabaseConfigured.mockReturnValue(false);
    mockGetSupabase.mockReturnValue(null);

    const result = await deleteAccountAndData();

    expect(result.ok).toBe(true);
    expect(mockDeleteOwnSupabaseAccount).not.toHaveBeenCalled();
    expect(mockClearAllData).toHaveBeenCalled();
  });
});
