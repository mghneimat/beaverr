import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getSupabase } from '../supabase.js';

const reported = new Set();
const DEDUPE_MS = 60_000;

/**
 * @param {{
 *   severity?: 'debug' | 'warning' | 'error' | 'blocker',
 *   category?: 'auth' | 'sync' | 'advice' | 'chat' | 'onboarding' | 'ui' | 'unknown',
 *   message: string,
 *   stack?: string,
 *   context?: Record<string, unknown>,
 *   locale?: string,
 * }} input
 */
export async function reportClientError(input) {
  const supabase = getSupabase();
  if (!supabase || !input?.message) return;

  const key = `${input.category ?? 'unknown'}:${input.message}`;
  const now = Date.now();
  if (reported.has(key)) return;
  reported.add(key);
  setTimeout(() => reported.delete(key), DEDUPE_MS);

  const appVersion =
    Constants.expoConfig?.version ??
    Constants.manifest?.version ??
    Constants.manifest2?.extra?.expoClient?.version ??
    null;

  try {
    await supabase.functions.invoke('log-error', {
      body: {
        severity: input.severity ?? 'error',
        category: input.category ?? 'unknown',
        message: String(input.message).slice(0, 2000),
        stack: input.stack ? String(input.stack).slice(0, 4000) : undefined,
        context: sanitizeContext(input.context),
        platform: Platform.OS,
        app_version: appVersion,
        locale: input.locale,
      },
    });
  } catch (err) {
    console.warn('reportClientError failed:', err);
  }
}

/**
 * @param {Record<string, unknown> | undefined} context
 */
function sanitizeContext(context) {
  if (!context || typeof context !== 'object') return {};
  const safe = { ...context };
  delete safe.email;
  delete safe.password;
  delete safe.token;
  return safe;
}
