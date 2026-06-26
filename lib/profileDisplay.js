/**
 * Resolve the signed-in user's display name for profile chrome.
 * @param {import('./schema').Household|null|undefined} household
 * @param {(key: string, params?: object) => string} t
 * @param {import('@supabase/supabase-js').User|null|undefined} [authUser]
 */
export function resolveProfileDisplayName(household, t, authUser) {
  const name = household?.displayName?.trim();
  if (name) return name;

  const meta = authUser?.user_metadata ?? {};
  const fullName = typeof meta.full_name === 'string' ? meta.full_name : '';
  const display = typeof meta.name === 'string' ? meta.name : fullName;
  const given = typeof meta.given_name === 'string' ? meta.given_name : '';
  const family = typeof meta.family_name === 'string' ? meta.family_name : '';

  if (given) {
    return [given, family].filter(Boolean).join(' ');
  }
  if (display.trim()) {
    return display.trim();
  }

  return t('dashboard.headerToolbar.defaultDisplayName');
}

/**
 * First token of the display name — used for the profile menu button label.
 * @param {import('./schema').Household|null|undefined} household
 * @param {(key: string, params?: object) => string} t
 * @param {import('@supabase/supabase-js').User|null|undefined} [authUser]
 */
export function resolveProfileFirstName(household, t, authUser) {
  const full = resolveProfileDisplayName(household, t, authUser);
  const first = full.trim().split(/\s+/)[0];
  return first || full;
}
