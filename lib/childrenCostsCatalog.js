/** @typedef {'0-2'|'3-5'|'6-15'|'16-18'|'18+'} ChildAgeGroup */

export const CHILD_AGE_GROUPS = ['0-2', '3-5', '6-15', '16-18', '18+'];

/** @type {Record<ChildAgeGroup, string[]>} */
export const CHILD_COST_CATEGORY_ORDER = {
  '0-2': ['childcare', 'babyNeeds'],
  '3-5': ['earlyEducation'],
  '6-15': ['school', 'activities'],
  '16-18': ['school', 'independence'],
  '18+': ['universityEducation', 'livingCosts', 'allowancePersonal', 'health'],
};

/** @type {Record<ChildAgeGroup, Record<string, string[]>>} */
export const CHILD_COST_CATALOG = {
  '0-2': {
    childcare: ['daycare', 'nanny'],
    babyNeeds: ['diapers', 'formula', 'clothing'],
  },
  '3-5': {
    earlyEducation: ['kindergarten', 'afterSchoolClub', 'extracurricular', 'toys'],
  },
  '6-15': {
    school: ['schoolFees', 'schoolSupplies', 'afterSchoolClub'],
    activities: ['extracurricular', 'tutoring', 'transport'],
  },
  '16-18': {
    school: ['schoolFees', 'schoolSupplies', 'afterSchoolClub', 'tutoring'],
    independence: ['drivingLessons', 'allowance', 'phone'],
  },
  '18+': {
    universityEducation: ['uniFees', 'uniAccommodation', 'uniBooks', 'uniTransport'],
    livingCosts: ['rentSupport', 'foodSupport', 'utilitiesSupport', 'transportSupport'],
    allowancePersonal: ['allowance', 'phone', 'clothing', 'personalCare'],
    health: ['healthInsurance', 'dental', 'sportsFitness'],
  },
};

/** Maps legacy saved field keys to catalog source keys. */
export const LEGACY_FIELD_TO_SOURCE = {
  daycare: 'daycare',
  nanny: 'nanny',
  nappies: 'diapers',
  babySupplies: 'formula',
  kindergarten: 'kindergarten',
  afterHours: 'afterSchoolClub',
  afterSchool: 'afterSchoolClub',
  extracurricular: 'extracurricular',
  schoolFees: 'schoolFees',
  schoolSupplies: 'schoolSupplies',
  tutoring: 'tutoring',
  drivingLessons: 'drivingLessons',
  uniFees: 'uniFees',
};

/**
 * @param {string} ageGroup
 * @returns {string[]}
 */
export function childCostCategoriesForAge(ageGroup) {
  return CHILD_COST_CATEGORY_ORDER[ageGroup] || CHILD_COST_CATEGORY_ORDER['6-15'];
}

/**
 * @param {string} ageGroup
 * @returns {string[]}
 */
export function allChildCostSourcesForAge(ageGroup) {
  const catalog = CHILD_COST_CATALOG[ageGroup] || {};
  return childCostCategoriesForAge(ageGroup).flatMap((cat) => catalog[cat] || []);
}

/**
 * @param {string} ageGroup
 * @param {string} sourceKey
 * @returns {string|null}
 */
export function childCostCategoryForSource(ageGroup, sourceKey) {
  const normalized = normalizeChildCostSourceKey(sourceKey);
  const catalog = CHILD_COST_CATALOG[ageGroup] || {};
  for (const categoryId of childCostCategoriesForAge(ageGroup)) {
    if ((catalog[categoryId] || []).includes(normalized)) return categoryId;
  }
  return null;
}

/**
 * @param {string} sourceKey
 * @returns {string}
 */
export function normalizeChildCostSourceKey(sourceKey) {
  if (!sourceKey || sourceKey.startsWith('other_')) return sourceKey;
  return LEGACY_FIELD_TO_SOURCE[sourceKey] || sourceKey;
}

/**
 * @param {ChildAgeGroup|string} ageGroup
 * @returns {string}
 */
export function childAgeGroupLabelKey(ageGroup) {
  switch (ageGroup) {
    case '0-2': return 'onboarding.childrenCosts.childrenCosts.age0_2';
    case '3-5': return 'onboarding.childrenCosts.childrenCosts.age3_5';
    case '6-15': return 'onboarding.childrenCosts.childrenCosts.age6_15';
    case '16-18': return 'onboarding.childrenCosts.childrenCosts.age16_18';
    case '18+': return 'onboarding.childrenCosts.childrenCosts.age18plus';
    default: return 'onboarding.childrenCosts.childrenCosts.age6_15';
  }
}

/**
 * @param {ChildAgeGroup|string} ageGroup
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function childAgeGroupLabel(ageGroup, t) {
  const key = childAgeGroupLabelKey(ageGroup);
  const translated = t(key);
  return translated !== key ? translated : String(ageGroup);
}

/**
 * @param {string} categoryId
 * @returns {string}
 */
export function childCostCategoryLabelKey(categoryId) {
  return `onboarding.childrenCosts.childrenCosts.categories.${categoryId}`;
}

/**
 * @param {string} sourceKey
 * @returns {string}
 */
export function childCostSourceLabelKey(sourceKey) {
  const normalized = normalizeChildCostSourceKey(sourceKey);
  if (normalized.startsWith('other_')) {
    return 'onboarding.childrenCosts.childrenCosts.field.other';
  }
  return `onboarding.childrenCosts.childrenCosts.sources.${normalized}`;
}

/**
 * @param {string} sourceKey
 * @param {string} [customLabel='']
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function childCostDisplayName(sourceKey, customLabel, t) {
  if (sourceKey?.startsWith('other_')) {
    return customLabel?.trim() || t('onboarding.childrenCosts.childrenCosts.field.other');
  }
  const key = childCostSourceLabelKey(sourceKey);
  const translated = t(key);
  return translated !== key ? translated : sourceKey;
}

/**
 * @param {ChildAgeGroup|string} ageGroup
 * @returns {string}
 */
export function childAgeGroupPickerLabelKey(ageGroup) {
  switch (ageGroup) {
    case '0-2': return 'onboarding.household.childDetails.age0';
    case '3-5': return 'onboarding.household.childDetails.age3';
    case '6-15': return 'onboarding.household.childDetails.age6';
    case '16-18': return 'onboarding.household.childDetails.age16';
    case '18+': return 'onboarding.household.childDetails.age18';
    default: return 'onboarding.household.childDetails.age6';
  }
}

/**
 * Compact chip labels for the children-costs age picker row.
 * @param {ChildAgeGroup|string} ageGroup
 * @returns {string}
 */
export function childAgeGroupChipLabelKey(ageGroup) {
  switch (ageGroup) {
    case '0-2': return 'onboarding.childrenCosts.childrenCosts.ageChip0_2';
    case '3-5': return 'onboarding.childrenCosts.childrenCosts.ageChip3_5';
    case '6-15': return 'onboarding.childrenCosts.childrenCosts.ageChip6_15';
    case '16-18': return 'onboarding.childrenCosts.childrenCosts.ageChip16_18';
    case '18+': return 'onboarding.childrenCosts.childrenCosts.ageChip18plus';
    default: return 'onboarding.childrenCosts.childrenCosts.ageChip6_15';
  }
}
