import { persistSignUpProfile } from '../../lib/auth/persistSignUpProfile';

const mockGetData = jest.fn();
const mockSetData = jest.fn();
const mockSetLocale = jest.fn();

jest.mock('../../lib/storage.js', () => ({
  getData: (...args) => mockGetData(...args),
  setData: (...args) => mockSetData(...args),
}));

describe('persistSignUpProfile', () => {
  beforeEach(() => {
    mockGetData.mockReset();
    mockSetData.mockReset();
    mockSetLocale.mockReset();
    mockGetData.mockResolvedValue(null);
    mockSetLocale.mockResolvedValue(undefined);
  });

  it('writes household display name, location, settings, and applies locale', async () => {
    await persistSignUpProfile({
      firstName: 'Anna',
      lastName: 'Nová',
      username: 'anna_n',
      countryCode: 'CZ',
      currency: 'CZK',
      language: 'cs',
      setLocale: mockSetLocale,
    });

    expect(mockSetData).toHaveBeenCalledWith('beaverr_household', {
      type: 'solo',
      displayName: 'Anna Nová',
      partnerName: null,
      children: [],
    });
    expect(mockSetData).toHaveBeenCalledWith('beaverr_location', {
      country: 'CZ',
      city: null,
      currency: 'CZK',
    });
    expect(mockSetData).toHaveBeenCalledWith('beaverr_settings', { language: 'cs', username: 'anna_n' });
    expect(mockSetLocale).toHaveBeenCalledWith('cs');
  });

  it('uses first name only when last name is empty', async () => {
    await persistSignUpProfile({
      firstName: 'Jan',
      lastName: '',
      username: 'jan',
      countryCode: 'CZ',
      currency: 'CZK',
      language: 'en',
    });

    expect(mockSetData).toHaveBeenCalledWith('beaverr_household', expect.objectContaining({
      displayName: 'Jan',
    }));
    expect(mockSetLocale).not.toHaveBeenCalled();
  });
});
