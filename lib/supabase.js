import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { normalizeSupabaseKey } from './supabaseRest.js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = normalizeSupabaseKey(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null;

/**
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Lazy singleton — returns null when env vars are unset (offline / pre-auth dev).
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // OAuth callback exchanges the code manually in oauthCallback.js — avoid double exchange on web.
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }
  return client;
}
