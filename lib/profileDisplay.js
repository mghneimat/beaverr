/**
 * @param {...string|null|undefined} parts
 * @returns {string}
 */
export function joinAccountNameParts(...parts) {
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ');
}

/**
 * Resolve the signed-in user's display name for profile chrome.
 * @param {import('./schema').Household|null|undefined} household
 * @param {(key: string, params?: object) => string} t
 * @param {import('@supabase/supabase-js').User|null|undefined} [authUser]
 * @param {{ firstName?: string, lastName?: string, username?: string }|null|undefined} [accountFields]
 */
export function resolveProfileDisplayName(household, t, authUser, accountFields = null) {
  const name = household?.displayName?.trim();
  if (name) return name;

  const fromAccount = accountFields
    ? joinAccountNameParts(accountFields.firstName, accountFields.lastName)
    : '';
  if (fromAccount) return fromAccount;

  const meta = authUser?.user_metadata ?? {};
  const fullName = typeof meta.full_name === 'string' ? meta.full_name : '';
  const display = typeof meta.name === 'string' ? meta.name : fullName;
  const given = typeof meta.given_name === 'string' ? meta.given_name : '';
  const family = typeof meta.family_name === 'string' ? meta.family_name : '';

  if (given) {
    return joinAccountNameParts(given, family);
  }
  if (display.trim()) {
    return display.trim();
  }

  const username = typeof accountFields?.username === 'string'
    ? accountFields.username.trim()
    : '';
  if (username) return username;

  return t('dashboard.headerToolbar.defaultDisplayName');
}

/**
 * First menu row label — user's first and last name when available.
 * @param {import('./schema').Household|null|undefined} household
 * @param {(key: string, params?: object) => string} t
 * @param {import('@supabase/supabase-js').User|null|undefined} [authUser]
 * @param {{ firstName?: string, lastName?: string, username?: string }|null|undefined} [accountFields]
 */
export function resolveProfileMenuName(household, t, authUser, accountFields = null) {
  const householdName = household?.displayName?.trim();
  const fromAccount = accountFields
    ? joinAccountNameParts(accountFields.firstName, accountFields.lastName)
    : '';

  if (fromAccount && householdName) {
    return fromAccount.length >= householdName.length ? fromAccount : householdName;
  }
  if (householdName) return householdName;
  if (fromAccount) return fromAccount;

  const meta = authUser?.user_metadata ?? {};
  const fromAuth = joinAccountNameParts(meta.given_name, meta.family_name);
  if (fromAuth) return fromAuth;

  const fullName = typeof meta.full_name === 'string' ? meta.full_name.trim() : '';
  const display = typeof meta.name === 'string' ? meta.name.trim() : fullName;
  if (display) return display;

  return resolveProfileDisplayName(household, t, authUser, accountFields);
}