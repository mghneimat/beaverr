import { ensureDefaultLocation } from '../../lib/onboarding/ensureDefaultLocation';

const mockGetData = jest.fn();
const mockSetData = jest.fn();

jest.mock('../../lib/storage.js', () => ({
  getData: (...args) => mockGetData(...args),
  setData: (...args) => mockSetData(...args),
}));

describe('ensureDefaultLocation', () => {
  beforeEach(() => {
    mockGetData.mockReset();
    mockSetData.mockReset();
  });

  it('returns existing location when country and currency are set', async () => {
    const existing = { country: 'DE', city: 'Berlin', currency: 'EUR' };
    mockGetData.mockResolvedValue(existing);

    const result = await ensureDefaultLocation();

    expect(result).toEqual(existing);
    expect(mockSetData).not.toHaveBeenCalled();
  });

  it('seeds CZ defaults when location is missing', async () => {
    mockGetData.mockResolvedValue(null);

    const result = await ensureDefaultLocation();

    expect(result).toEqual({ country: 'CZ', city: null, currency: 'CZK' });
    expect(mockSetData).toHaveBeenCalledWith('beaverr_location', {
      country: 'CZ',
      city: null,
      currency: 'CZK',
    });
  });

  it('fills missing currency on partial location', async () => {
    mockGetData.mockResolvedValue({ country: 'CZ', city: 'Brno' });

    const result = await ensureDefaultLocation();

    expect(result.currency).toBe('CZK');
    expect(mockSetData).toHaveBeenCalled();
  });
});
