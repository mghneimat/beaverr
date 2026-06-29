/**
 * Resolve which health storage keys belong to the current household profile.
 * @param {string} key
 * @param {object|null|undefined} household
 * @returns {boolean}
 */
export function isActiveHealthMemberKey(key, household) {
  if (key === 'user' || key === 'self') return true;
  if (key === 'partner') return Boolean(household?.partnerName);
  if (key.startsWith('child_')) {
    const idx = parseInt(key.replace('child_', ''), 10);
    return Number.isFinite(idx) && idx >= 0 && idx < (household?.children?.length || 0);
  }
  return false;
}

/**
 * Localized label for a health insurance line item.
 * @param {string} key
 * @param {object|null|undefined} household
 * @param {(translationKey: string, params?: Record<string, string|number>) => string} t
 * @returns {string}
 */
export function getHealthMemberLabel(key, household, t) {
  if (key === 'user' || key === 'self') return t('dashboard.recurring.healthSelf');
  if (key === 'partner') return t('dashboard.recurring.healthPartner');
  if (key.startsWith('child_')) return t('dashboard.recurring.healthChild');
  return key;
}

/**
 * Full commitment label for prepaid health insurance sinking funds.
 * @param {string} key
 * @param {object|null|undefined} household
 * @param {(translationKey: string, params?: Record<string, string|number>) => string} t
 * @returns {string}
 */
export function getSinkingHealthInsuranceName(key, household, t) {
  if (key === 'user' || key === 'self') {
    return t('dashboard.savingsScreen.sinkingFund.healthInsuranceYou');
  }
  if (key === 'partner') {
    const name = household?.partnerName?.trim();
    if (name) {
      return t('dashboard.savingsScreen.sinkingFund.healthInsuranceNamed', { name });
    }
    return t('dashboard.savingsScreen.sinkingFund.healthInsurancePartnerFallback');
  }
  if (key.startsWith('child_')) {
    const idx = parseInt(key.replace('child_', ''), 10);
    const child = household?.children?.[idx];
    const name = child?.displayName?.trim();
    if (name) {
      return t('dashboard.savingsScreen.sinkingFund.healthInsuranceNamed', { name });
    }
    return t('dashboard.savingsScreen.sinkingFund.healthInsuranceChildFallback', {
      index: Number.isFinite(idx) ? idx + 1 : 1,
    });
  }
  return key;
}
