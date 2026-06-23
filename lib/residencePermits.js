/** @typedef {'permanentResidence'|'blueCard'|'employeeCard'|'studentVisa'|'longTermVisa'|'familyReunion'|'other'} ResidencePermitType */

/** @typedef {import('./schema').AgeGroup} AgeGroup */

/** Typical CZ residence permit renewal fee for children under 15 (CZK). */
export const CHILD_RESIDENCE_PERMIT_RENEWAL_UNDER_15 = 1000;

export const RESIDENCE_PERMIT_TYPES = [
  'permanentResidence',
  'blueCard',
  'employeeCard',
  'studentVisa',
  'longTermVisa',
  'familyReunion',
  'other',
];

/**
 * @param {ResidencePermitType|string|null|undefined} type
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function getResidencePermitLabel(type, t) {
  if (!type) return '';
  const key = `onboarding.residencePermit.types.${type}`;
  const translated = t(key);
  return translated !== key ? translated : type;
}

/**
 * Age groups where child permit renewal is typically 1000 CZK in CZ.
 * @param {AgeGroup|string|null|undefined} ageGroup
 * @returns {boolean}
 */
export function isChildUnder15ForPermitRenewal(ageGroup) {
  return ageGroup === '0-2' || ageGroup === '3-5' || ageGroup === '6-15';
}

/**
 * Default renewal cost for a child's permit from household age group.
 * @param {AgeGroup|string|null|undefined} ageGroup
 * @returns {number|null}
 */
export function defaultChildResidencePermitRenewalCost(ageGroup) {
  if (isChildUnder15ForPermitRenewal(ageGroup)) {
    return CHILD_RESIDENCE_PERMIT_RENEWAL_UNDER_15;
  }
  return null;
}
