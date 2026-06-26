import {
  normalizeUsername,
  isValidUsernameFormat,
  checkUsernameAvailable,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from '../../lib/auth/username';

const mockCallSupabaseRpc = jest.fn();
const mockInvoke = jest.fn();
const mockGetSupabase = jest.fn();

jest.mock('../../lib/supabaseRest.js', () => ({
  callSupabaseRpc: (...args) => mockCallSupabaseRpc(...args),
}));

jest.mock('../../lib/supabase.js', () => ({
  getSupabase: () => mockGetSupabase(),
}));

describe('username', () => {
  beforeEach(() => {
    mockCallSupabaseRpc.mockReset();
    mockInvoke.mockReset();
    mockGetSupabase.mockReset();
    mockGetSupabase.mockReturnValue({
      functions: { invoke: mockInvoke },
    });
  });

  describe('normalizeUsername', () => {
    it('trims and lowercases', () => {
      expect(normalizeUsername('  Anna_K  ')).toBe('anna_k');
    });
  });

  describe('isValidUsernameFormat', () => {
    it('accepts valid usernames', () => {
      expect(isValidUsernameFormat('anna_k')).toBe(true);
      expect(isValidUsernameFormat('user123')).toBe(true);
    });

    it('rejects too short or invalid characters', () => {
      expect(isValidUsernameFormat('ab')).toBe(false);
      expect(isValidUsernameFormat('a'.repeat(USERNAME_MAX_LENGTH + 1))).toBe(false);
      expect(isValidUsernameFormat('bad-name')).toBe(false);
      expect(isValidUsernameFormat('spaces here')).toBe(false);
    });

    it(`requires at least ${USERNAME_MIN_LENGTH} characters`, () => {
      expect(isValidUsernameFormat('ab')).toBe(false);
      expect(isValidUsernameFormat('abc')).toBe(true);
    });
  });

  describe('checkUsernameAvailable', () => {
    it('returns invalid without calling supabase', async () => {
      const result = await checkUsernameAvailable('x');
      expect(result).toEqual({ ok: false, reason: 'invalid' });
      expect(mockCallSupabaseRpc).not.toHaveBeenCalled();
    });

    it('returns available when rpc is true', async () => {
      mockCallSupabaseRpc.mockResolvedValue({ data: true, error: null });
      const result = await checkUsernameAvailable('anna_k');
      expect(result).toEqual({ ok: true, username: 'anna_k' });
      expect(mockCallSupabaseRpc).toHaveBeenCalledWith('is_username_available', { check_username: 'anna_k' });
    });

    it('returns taken when rpc is false', async () => {
      mockCallSupabaseRpc.mockResolvedValue({ data: false, error: null });
      const result = await checkUsernameAvailable('taken_user');
      expect(result).toEqual({ ok: false, reason: 'taken' });
    });

    it('returns unconfigured when supabase is missing', async () => {
      mockGetSupabase.mockReturnValue(null);
      const result = await checkUsernameAvailable('anna_k');
      expect(result).toEqual({ ok: false, reason: 'unconfigured' });
    });

    it('falls back to edge function when rpc fails', async () => {
      mockCallSupabaseRpc.mockResolvedValue({ data: null, error: { message: 'rpc missing' } });
      mockInvoke.mockResolvedValue({ data: { available: true }, error: null });
      const result = await checkUsernameAvailable('anna_k');
      expect(result).toEqual({ ok: true, username: 'anna_k' });
      expect(mockInvoke).toHaveBeenCalledWith('username-check', { body: { username: 'anna_k' } });
    });
  });
});
