import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '../supabase.js';
import {
  signInWithPassword as apiSignIn,
  signOut as apiSignOut,
  signUpWithPassword as apiSignUp,
} from './authApi.js';
import { signInWithOAuthProvider } from './oauth.js';
import { setCloudSyncSession, pullCloudHousehold } from '../cloud/syncHousehold.js';
import { ensureLocalDataForUser } from './userDataScope.js';

/**
 * @typedef {{
 *   session: import('@supabase/supabase-js').Session | null,
 *   user: import('@supabase/supabase-js').User | null,
 *   loading: boolean,
 *   configured: boolean,
 *   signInWithPassword: (email: string, password: string) => Promise<{ ok: boolean, error?: string, session?: import('@supabase/supabase-js').Session | null }>,
 *   signUpWithPassword: (email: string, password: string, options?: { locale?: string }) => Promise<{ ok: boolean, error?: string, session?: import('@supabase/supabase-js').Session | null }>,
 *   signInWithOAuth: (provider: import('./oauth.js').OAuthProvider) => Promise<{ ok: boolean, error?: string, session?: import('@supabase/supabase-js').Session | null, pendingRedirect?: boolean }>,
 *   signOut: () => Promise<void>,
 *   pullCloudHousehold: () => Promise<{ ok: boolean, error?: string, action?: string }>,
 * }} AuthContextValue
 */

/** @type {React.Context<AuthContextValue | null>} */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured());

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      setCloudSyncSession(null);
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const nextSession = data.session ?? null;
      setSession(nextSession);
      setCloudSyncSession(nextSession);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setCloudSyncSession(nextSession);
      if (nextSession?.user?.id) {
        try {
          await ensureLocalDataForUser(nextSession.user.id);
        } catch (error) {
          console.warn('ensureLocalDataForUser failed:', error);
        }
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(async (email, password) => {
    const result = await apiSignIn(email, password);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    return { ok: true, session: result.session };
  }, []);

  const signUpWithPassword = useCallback(async (email, password, options) => {
    const result = await apiSignUp(email, password, options);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    return { ok: true, session: result.session };
  }, []);

  const signInWithOAuth = useCallback(async (provider) => {
    const result = await signInWithOAuthProvider(provider);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    return {
      ok: true,
      session: result.session ?? null,
      pendingRedirect: result.pendingRedirect ?? false,
    };
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setCloudSyncSession(null);
  }, []);

  const pullCloud = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      return { ok: false, error: 'supabase_not_configured' };
    }
    const { data } = await supabase.auth.getSession();
    const current = data.session;
    if (!current) {
      return { ok: false, error: 'no_session' };
    }
    return pullCloudHousehold(current);
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    configured: isSupabaseConfigured(),
    signInWithPassword,
    signUpWithPassword,
    signInWithOAuth,
    signOut,
    pullCloudHousehold: pullCloud,
  }), [session, loading, signInWithPassword, signUpWithPassword, signInWithOAuth, signOut, pullCloud]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/** @returns {AuthContextValue} */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
