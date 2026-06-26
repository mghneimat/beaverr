import {
  ensureLocalDataForUser,
  localSnapshotHasData,
  setStoredAuthUserId,
} from '../../lib/auth/userDataScope';

const mockGetData = jest.fn();
const mockSetData = jest.fn();
const mockClearAllData = jest.fn();
const mockRemoveData = jest.fn();
const mockGetHouseholdForUser = jest.fn();

jest.mock('../../lib/storage.js', () => ({
  getData: (...args) => mockGetData(...args),
  setData: (...args) => mockSetData(...args),
  clearAllData: (...args) => mockClearAllData(...args),
  removeData: (...args) => mockRemoveData(...args),
}));

jest.mock('../../lib/cloud/householdRepository.js', () => ({
  getHouseholdForUser: (...args) => mockGetHouseholdForUser(...args),
}));

describe('userDataScope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetData.mockResolvedValue(null);
    mockSetData.mockResolvedValue(undefined);
    mockClearAllData.mockResolvedValue(undefined);
    mockRemoveData.mockResolvedValue(undefined);
    mockGetHouseholdForUser.mockResolvedValue(null);
  });

  it('returns noop when storage already belongs to the user', async () => {
    mockGetData.mockImplementation(async (key) => {
      if (key === 'beaverr_settings') return { authUserId: 'user-a' };
      return null;
    });

    const result = await ensureLocalDataForUser('user-a');

    expect(result.action).toBe('noop');
    expect(mockClearAllData).not.toHaveBeenCalled();
  });

  it('clears local data when switching accounts', async () => {
    mockGetData.mockImplementation(async (key) => {
      if (key === 'beaverr_settings') return { authUserId: 'user-a' };
      if (key === 'beaverr_income') return { salary: 1000 };
      return null;
    });

    const result = await ensureLocalDataForUser('user-b');

    expect(result.action).toBe('switched_user');
    expect(mockClearAllData).toHaveBeenCalled();
    expect(mockSetData).toHaveBeenCalledWith('beaverr_settings', expect.objectContaining({
      authUserId: 'user-b',
    }));
  });

  it('clears stale local data for a first-time account with empty cloud', async () => {
    mockGetData.mockImplementation(async (key) => {
      if (key === 'beaverr_onboarding') return { dashboardUnlocked: true };
      return null;
    });

    const result = await ensureLocalDataForUser('new-user');

    expect(result.action).toBe('cleared_stale_local');
    expect(mockClearAllData).toHaveBeenCalled();
  });

  it('clears local data before linking to cloud-backed account', async () => {
    mockGetData.mockImplementation(async (key) => {
      if (key === 'beaverr_income') return { salary: 1000 };
      return null;
    });
    mockGetHouseholdForUser.mockResolvedValue({
      householdId: 'hh-1',
      data: { beaverr_income: { salary: 2000 } },
      version: 2,
      updatedAt: new Date().toISOString(),
    });

    const result = await ensureLocalDataForUser('remote-user');

    expect(result.action).toBe('linked_remote');
    expect(mockClearAllData).toHaveBeenCalled();
  });

  it('detects local snapshot data', async () => {
    mockGetData.mockImplementation(async (key) => (
      key === 'beaverr_budget' ? { flexible: 100 } : null
    ));

    await expect(localSnapshotHasData()).resolves.toBe(true);
  });

  it('stores auth user id in settings', async () => {
    mockGetData.mockResolvedValue({ language: 'en' });

    await setStoredAuthUserId('user-1');

    expect(mockSetData).toHaveBeenCalledWith('beaverr_settings', {
      language: 'en',
      authUserId: 'user-1',
    });
  });
});
