import { resolveBootRoute } from '../../lib/auth/bootRouting';
import { SYNCABLE_STORAGE_KEYS } from '../../lib/cloud/syncKeys';
import { STORAGE_KEYS } from '../../lib/beaverrConstants';

describe('resolveBootRoute', () => {
  it('requires auth when not signed in', () => {
    expect(resolveBootRoute({
      hasSession: false,
      supabaseConfigured: true,
      onboarding: null,
    })).toBe('auth_welcome');
  });

  it('shows misconfig when supabase env missing', () => {
    expect(resolveBootRoute({
      hasSession: false,
      supabaseConfigured: false,
      onboarding: null,
    })).toBe('auth_required_misconfig');
  });

  it('routes to onboarding when signed in but dashboard locked', () => {
    expect(resolveBootRoute({
      hasSession: true,
      supabaseConfigured: true,
      onboarding: { completed: false, currentStep: 'welcome' },
    })).toBe('onboarding_welcome');
  });

  it('routes to dashboard when questionnaire complete', () => {
    expect(resolveBootRoute({
      hasSession: true,
      supabaseConfigured: true,
      onboarding: {
        completed: true,
        questionnaireComplete: true,
        dashboardUnlocked: true,
      },
    })).toBe('dashboard');
  });
});

describe('SYNCABLE_STORAGE_KEYS', () => {
  it('excludes local-only storage migration key', () => {
    expect(SYNCABLE_STORAGE_KEYS).not.toContain(STORAGE_KEYS.storageMigrated);
    expect(SYNCABLE_STORAGE_KEYS).toContain(STORAGE_KEYS.household);
  });
});
