import {
  loadAccountRegistrationFields,
  loadPreferenceRegistrationFields,
  saveAccountRegistrationFields,
  savePreferenceRegistrationFields,
} from '../../lib/account/registrationProfile';

const mockGetData = jest.fn();
const mockSetData = jest.fn();
const mockCheckUsernameAvailable = jest.fn();
const mockClaimProfileUsername = jest.fn();
const mockGetProfileUsername = jest.fn();
const mockUpdateProfileLocale = jest.fn();
const mockNotifyDashboardRefresh = jest.fn();

jest.mock('../../lib/storage.js', () => ({
  getData: (...args) => mockGetData(...args),
  setData: (...args) => mockSetData(...args),
}));

jest.mock('../../lib/auth/username.js', () => ({
  normalizeUsername: (value) => value.trim().toLowerCase(),
  isValidUsernameFormat: (value) => /^[a-z0-9_]{3,20}$/.test(value.trim().toLowerCase()),
  checkUsernameAvailable: (...args) => mockCheckUsernameAvailable(...args),
}));

jest.mock('../../lib/cloud/householdRepository.js', () => ({
  claimProfileUsername: (...args) => mockClaimProfileUsername(...args),
  getProfileUsername: (...args) => mockGetProfileUsername(...args),
  updateProfileLocale: (...args) => mockUpdateProfileLocale(...args),
}));

jest.mock('../../lib/dashboardRefresh.js', () => ({
  notifyDashboardRefresh: () => mockNotifyDashboardRefresh(),
}));

describe('registrationProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetData.mockImplementation(async (key) => {
      if (key === 'beaverr_household') {
        return { type: 'solo', displayName: 'Anna Novak', children: [] };
      }
      if (key === 'beaverr_settings') {
        return { language: 'en', username: 'anna_n' };
      }
      if (key === 'beaverr_location') {
        return { country: 'CZ', currency: 'CZK' };
      }
      return null;
    });
    mockSetData.mockResolvedValue(undefined);
    mockGetProfileUsername.mockResolvedValue(null);
    mockCheckUsernameAvailable.mockResolvedValue({ ok: true, username: 'anna_n' });
    mockClaimProfileUsername.mockResolvedValue({ ok: true });
    mockUpdateProfileLocale.mockResolvedValue(undefined);
  });

  it('loads account fields from household display name', async () => {
    const fields = await loadAccountRegistrationFields('user-1');

    expect(fields).toEqual({
      firstName: 'Anna',
      lastName: 'Novak',
      username: 'anna_n',
    });
  });

  it('loads preference fields from location and settings', async () => {
    const fields = await loadPreferenceRegistrationFields();

    expect(fields.selectedCountry?.code).toBe('CZ');
    expect(fields.currency).toBe('CZK');
    expect(fields.language).toBe('en');
  });

  it('saves account fields without re-claiming unchanged username', async () => {
    const result = await saveAccountRegistrationFields({
      firstName: 'Anna',
      lastName: 'Smith',
      username: 'anna_n',
      userId: 'user-1',
    });

    expect(result.ok).toBe(true);
    expect(mockClaimProfileUsername).not.toHaveBeenCalled();
    expect(mockSetData).toHaveBeenCalledWith('beaverr_household', expect.objectContaining({
      displayName: 'Anna Smith',
    }));
    expect(mockNotifyDashboardRefresh).toHaveBeenCalled();
  });

  it('saves preference fields and updates locale', async () => {
    const setLocale = jest.fn().mockResolvedValue(undefined);

    const result = await savePreferenceRegistrationFields({
      countryCode: 'CZ',
      currency: 'CZK',
      language: 'cs',
      userId: 'user-1',
      setLocale,
    });

    expect(result.ok).toBe(true);
    expect(mockUpdateProfileLocale).toHaveBeenCalledWith('user-1', 'cs');
    expect(setLocale).toHaveBeenCalledWith('cs');
    expect(mockNotifyDashboardRefresh).toHaveBeenCalled();
  });
});
