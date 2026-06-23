/**
 * Resolve the signed-in user's display name for profile chrome.
 * @param {import('./schema').Household|null|undefined} household
 * @param {(key: string, params?: object) => string} t
 */
export function resolveProfileDisplayName(household, t) {
  const name = household?.displayName?.trim();
  if (name) return name;
  return t('dashboard.headerToolbar.defaultDisplayName');
}

/**
 * First token of the display name — used for the profile menu button label.
 * @param {import('./schema').Household|null|undefined} household
 * @param {(key: string, params?: object) => string} t
 */
export function resolveProfileFirstName(household, t) {
  const full = resolveProfileDisplayName(household, t);
  const first = full.trim().split(/\s+/)[0];
  return first || full;
}
