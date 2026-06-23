/**
 * Catalog keys for other-income onboarding (select → fill).
 */
export const OTHER_INCOME_CATEGORY_ORDER = [
  'propertyRentals',
  'investmentsDividends',
  'pensionRetirement',
  'benefitsSupport',
  'sideIncome',
  'otherPassive',
];

export const OTHER_INCOME_CATALOG = {
  propertyRentals: ['rentalIncome', 'airbnb', 'subletting', 'landLease'],
  investmentsDividends: ['dividends', 'stockSales', 'crypto', 'p2pLending', 'etfIncome'],
  pensionRetirement: ['statePension', 'companyPension', 'privatePensionDrawdown', 'earlyRetirement'],
  benefitsSupport: ['parentalLeave', 'childBenefit', 'unemployment', 'disability', 'housingBenefit', 'carersAllowance'],
  sideIncome: ['marketplaceSales', 'cashbackRewards', 'referralBonuses', 'tips'],
  otherPassive: ['royalties', 'licensing', 'interestIncome', 'inheritanceGifts'],
};

export const OTHER_INCOME_SOURCE_KEYS = OTHER_INCOME_CATEGORY_ORDER.flatMap(
  (cat) => OTHER_INCOME_CATALOG[cat],
);

export const OTHER_INCOME_FREQUENCIES = ['daily', 'weekly', 'monthly', 'annual'];

/**
 * Onboarding income frequency — fortnightly removed from UI; map legacy saves to weekly.
 * @param {string} [frequency]
 * @returns {'daily' | 'weekly' | 'monthly' | 'annual'}
 */
export function normalizeOnboardingIncomeFrequency(frequency) {
  if (frequency === 'fortnightly') return 'weekly';
  return OTHER_INCOME_FREQUENCIES.includes(frequency) ? frequency : 'monthly';
}

/** @type {Record<string, string>} */
const LEGACY_CATEGORY_MIGRATION = {
  propertyInvestments: 'propertyRentals',
  supportBenefits: 'benefitsSupport',
  workPension: 'pensionRetirement',
};

/**
 * Maps pre-catalog-revision source keys to new category + sourceKey.
 * Unmatched legacy keys become custom ("other") rows with label preserved.
 * @type {Record<string, { category: string, sourceKey: string }>}
 */
const LEGACY_SOURCE_MIGRATION = {
  rental: { category: 'propertyRentals', sourceKey: 'rentalIncome' },
  dividends: { category: 'investmentsDividends', sourceKey: 'dividends' },
  childBenefit: { category: 'benefitsSupport', sourceKey: 'childBenefit' },
  pension: { category: 'pensionRetirement', sourceKey: 'statePension' },
  financialSupport: { category: 'benefitsSupport', sourceKey: 'other' },
  benefits: { category: 'benefitsSupport', sourceKey: 'other' },
  alimony: { category: 'benefitsSupport', sourceKey: 'other' },
  freelance: { category: 'sideIncome', sourceKey: 'other' },
};

/**
 * @param {string} sourceKey
 * @returns {boolean}
 */
export function isKnownOtherIncomeSourceKey(sourceKey) {
  return sourceKey === 'other' || OTHER_INCOME_SOURCE_KEYS.includes(sourceKey);
}

/**
 * @param {string} sourceKey
 * @returns {string|null}
 */
export function otherIncomeCategoryForKey(sourceKey) {
  for (const categoryId of OTHER_INCOME_CATEGORY_ORDER) {
    if (OTHER_INCOME_CATALOG[categoryId].includes(sourceKey)) return categoryId;
  }
  return null;
}

/**
 * @param {string} categoryId
 * @returns {string}
 */
export function otherIncomeCategoryLabelKey(categoryId) {
  return `onboarding.income.otherIncome.categories.${categoryId}`;
}

/**
 * @param {string} sourceKey
 * @returns {string}
 */
export function otherIncomeLabelKey(sourceKey) {
  return `onboarding.income.otherIncome.sources.${sourceKey}`;
}

/**
 * @param {{ sourceKey?: string, customLabel?: string, label?: string }} row
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function otherIncomeDisplayName(row, t) {
  if (row.sourceKey && row.sourceKey !== 'other') {
    const key = otherIncomeLabelKey(row.sourceKey);
    const translated = t(key);
    return translated !== key ? translated : row.sourceKey;
  }
  return (row.customLabel || row.label || '').trim()
    || t('onboarding.income.otherIncome.otherSourceLabel');
}

/**
 * @param {string} categoryId
 * @param {string} sourceKey
 * @param {string} [customLabel='']
 * @returns {object}
 */
export function emptyOtherIncomeItem(categoryId, sourceKey, customLabel = '') {
  const id = sourceKey === 'other'
    ? `inc_other_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    : `inc_${categoryId}_${sourceKey}`;
  return {
    id,
    category: categoryId,
    sourceKey,
    customLabel,
    amount: '',
    frequency: 'monthly',
    visible: true,
  };
}

/**
 * @param {object} row
 * @returns {{ category: string, sourceKey: string, customLabel: string }}
 */
function resolveOtherIncomeKeys(row) {
  let key = row.sourceKey || 'other';
  if (!row.sourceKey && row.label) {
    const matched = matchSourceKeyFromLabel(row.label);
    key = matched || 'other';
  }

  if (isKnownOtherIncomeSourceKey(key) && key !== 'other') {
    return {
      category: row.category || otherIncomeCategoryForKey(key) || OTHER_INCOME_CATEGORY_ORDER[0],
      sourceKey: key,
      customLabel: '',
    };
  }

  if (key !== 'other' && LEGACY_SOURCE_MIGRATION[key]) {
    const migrated = LEGACY_SOURCE_MIGRATION[key];
    const preservedLabel = row.customLabel || row.label || '';
    if (migrated.sourceKey === 'other') {
      return {
        category: migrated.category,
        sourceKey: 'other',
        customLabel: preservedLabel || key,
      };
    }
    return {
      category: migrated.category,
      sourceKey: migrated.sourceKey,
      customLabel: '',
    };
  }

  if (key !== 'other' && !isKnownOtherIncomeSourceKey(key)) {
    return {
      category: LEGACY_CATEGORY_MIGRATION[row.category] || row.category || OTHER_INCOME_CATEGORY_ORDER[0],
      sourceKey: 'other',
      customLabel: row.customLabel || row.label || key,
    };
  }

  const category = LEGACY_CATEGORY_MIGRATION[row.category]
    || row.category
    || OTHER_INCOME_CATEGORY_ORDER[0];

  return {
    category,
    sourceKey: 'other',
    customLabel: row.customLabel || row.label || '',
  };
}

/**
 * @param {object} row
 * @returns {object}
 */
export function normalizeOtherIncomeItem(row) {
  const { category, sourceKey, customLabel } = resolveOtherIncomeKeys(row);
  return {
    id: row.id || (sourceKey === 'other'
      ? `inc_other_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      : `inc_${category}_${sourceKey}`),
    category,
    sourceKey,
    customLabel: sourceKey === 'other' ? customLabel : '',
    amount: row.amount != null ? String(row.amount) : '',
    frequency: normalizeOnboardingIncomeFrequency(row.frequency),
    visible: row.visible !== false,
  };
}

/**
 * @param {string} label
 * @returns {string|null}
 */
function matchSourceKeyFromLabel(label) {
  const norm = String(label || '').trim().toLowerCase();
  if (!norm) return null;
  for (const key of OTHER_INCOME_SOURCE_KEYS) {
    if (norm.includes(key.toLowerCase())) return key;
  }
  return null;
}

/**
 * @param {object[]|null|undefined} savedRows
 * @returns {object[]}
 */
export function migrateOtherIncomeRowsFromSaved(savedRows) {
  if (!Array.isArray(savedRows) || savedRows.length === 0) return [];
  return savedRows.map(normalizeOtherIncomeItem);
}

/**
 * @param {object[]} rows
 * @param {(key: string) => string} t
 * @returns {object[]}
 */
export function rowsToSavedPayload(rows, t) {
  return (rows || [])
    .filter((row) => row.visible !== false)
    .map((row) => ({
      sourceKey: row.sourceKey || 'other',
      category: row.category || null,
      label: otherIncomeDisplayName(row, t),
      amount: row.amount ? parseFloat(row.amount) : null,
      frequency: row.frequency || 'monthly',
    }));
}

/**
 * @param {object[]} rows
 * @returns {boolean}
 */
export function hasOtherIncomeMissingLabel(rows) {
  return (rows || []).some(
    (row) => row.visible !== false
      && parseFloat(row.amount) > 0
      && row.sourceKey === 'other'
      && !String(row.customLabel || '').trim(),
  );
}

/**
 * @param {object[]} rows
 * @returns {object[]}
 */
export function getValidOtherIncomeRows(rows) {
  return (rows || []).filter(
    (row) => row.visible !== false
      && parseFloat(row.amount) > 0
      && (row.sourceKey !== 'other' || String(row.customLabel || '').trim().length > 0),
  );
}
