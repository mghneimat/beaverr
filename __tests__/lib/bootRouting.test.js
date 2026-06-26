import { resolveBootRoute, resolveBootRouteWithProfile } from '../../lib/auth/bootRouting';

jest.mock('../../lib/auth/profileGate.js', () => ({
  hasCompletedProfile: jest.fn(),
}));

const { hasCompletedProfile } = require('../../lib/auth/profileGate.js');

describe('resolveBootRoute', () => {
  it('returns auth_welcome without session', () => {
    expect(resolveBootRoute({
      hasSession: false,
      supabaseConfigured: true,
    })).toBe('auth_welcome');
  });

  it('returns auth_required_misconfig when Supabase is not configured', () => {
    expect(resolveBootRoute({
      hasSession: false,
      supabaseConfigured: false,
    })).toBe('auth_required_misconfig');
  });
});

describe('resolveBootRouteWithProfile', () => {
  beforeEach(() => {
    hasCompletedProfile.mockReset();
  });

  it('returns auth_complete_profile when session exists but profile is incomplete', async () => {
    hasCompletedProfile.mockResolvedValue(false);

    const route = await resolveBootRouteWithProfile({
      hasSession: true,
      supabaseConfigured: true,
      userId: 'user-1',
      onboarding: { completed: false },
    });

    expect(route).toBe('auth_complete_profile');
    expect(hasCompletedProfile).toHaveBeenCalledWith('user-1');
  });

  it('returns onboarding_welcome when profile is complete and dashboard is locked', async () => {
    hasCompletedProfile.mockResolvedValue(true);

    const route = await resolveBootRouteWithProfile({
      hasSession: true,
      supabaseConfigured: true,
      userId: 'user-1',
      onboarding: { completed: false, percentComplete: 0 },
    });

    expect(route).toBe('onboarding_welcome');
  });
});
