import { useAuth } from './auth/AuthProvider.jsx';

/**
 * Tracks Supabase Auth session — thin wrapper over AuthProvider.
 * @returns {ReturnType<typeof useAuth>}
 */
export function useSupabaseSession() {
  return useAuth();
}
