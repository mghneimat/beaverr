import { toMonthly } from './finance';

export const UTILITY_CATEGORY_ORDER = [
  'energy',
  'waterAndWaste',
  'buildingFees',
  'telecoms',
];

export const UTILITY_CATALOG = {
  energy: ['electricity', 'gas', 'districtHeating', 'solarFeedIn'],
  waterAndWaste: ['coldWater', 'hotWater', 'sewage', 'garbage'],
  buildingFees: ['serviceCharges', 'buildingFund', 'elevatorMaintenance', 'buildingInsurance', 'intercomEntry'],
  telecoms: ['landline', 'cableTv'],
};

export const UTILITY_KEYS = UTILITY_CATEGORY_ORDER.flatMap((cat) => UTILITY_CATALOG[cat]);

export const UTILITY_FREQUENCIES = ['monthly', 'quarterly', 'annual'];

/** @type {Record<string, { category: string, key: string }>} */
const LEGACY_UTILITY_KEY_MIGRATION = {
  water: { category: 'waterAndWaste', key: 'coldWater' },
  hotWater: { category: 'waterAndWaste', key: 'hotWater' },
  sewer: { category: 'waterAndWaste', key: 'sewage' },
  garbage: { category: 'waterAndWaste', key: 'garbage' },
  heating: { category: 'energy', key: 'districtHeating' },
  electricity: { category: 'energy', key: 'electricity' },
  gas: { category: 'energy', key: 'gas' },
};

/**
 * @param {string} key
 * @returns {boolean}
 */
export function isKnownUtilityKey(key) {
  return key === 'other' || UTILITY_KEYS.includes(key);
}

/**
 * @param {string} key
 * @returns {string|null}
 */
export function utilityCategoryForKey(key) {
  for (const categoryId of UTILITY_CATEGORY_ORDER) {
    if (UTILITY_CATALOG[categoryId].includes(key)) return categoryId;
  }
  return null;
}

/**
 * @param {string} categoryId
 * @returns {string}
 */
export function utilityCategoryLabelKey(categoryId) {
  return `onboarding.housing.rentUtilities.categories.${categoryId}`;
}

/**
 * @param {string} key
 * @returns {string}
 */
export function utilityLabelKey(key) {
  return `onboarding.housing.rentUtilities.utility${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}

/**
 * @param {{ key: string, customLabel?: string|null }} item
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function utilityDisplayName(item, t) {
  if (item.key === 'other') {
    return item.customLabel?.trim() || t('onboarding.housing.rentUtilities.otherUtilityLabel');
  }
  const key = utilityLabelKey(item.key);
  const translated = t(key);
  return translated !== key ? translated : item.key;
}

/**
 * @param {string} categoryId
 * @param {string} key
 * @param {string} [customLabel='']
 * @returns {object}
 */
export function emptyUtilityItem(categoryId, key, customLabel = '') {
  const id = key === 'other'
    ? `util_other_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    : `util_${categoryId}_${key}`;
  return {
    id,
    category: categoryId,
    key,
    customLabel,
    amount: '',
    frequency: 'monthly',
  };
}

/**
 * @param {object} row
 * @returns {{ category: string, key: string, customLabel: string }}
 */
function resolveUtilityKeys(row) {
  let key = row.key || 'other';

  if (isKnownUtilityKey(key) && key !== 'other') {
    return {
      category: row.category || utilityCategoryForKey(key) || UTILITY_CATEGORY_ORDER[0],
      key,
      customLabel: '',
    };
  }

  if (key !== 'other' && LEGACY_UTILITY_KEY_MIGRATION[key]) {
    const migrated = LEGACY_UTILITY_KEY_MIGRATION[key];
    return {
      category: migrated.category,
      key: migrated.key,
      customLabel: '',
    };
  }

  if (key !== 'other' && !isKnownUtilityKey(key)) {
    return {
      category: row.category || UTILITY_CATEGORY_ORDER[0],
      key: 'other',
      customLabel: row.customLabel || key,
    };
  }

  return {
    category: row.category || UTILITY_CATEGORY_ORDER[0],
    key: 'other',
    customLabel: row.customLabel || '',
  };
}

/**
 * @param {object} row
 * @returns {object}
 */
export function normalizeUtilityItem(row) {
  const { category, key, customLabel } = resolveUtilityKeys(row);
  return {
    id: row.id || (key === 'other'
      ? `util_other_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      : `util_${category}_${key}`),
    category,
    key,
    customLabel: key === 'other' ? customLabel : '',
    amount: row.amount != null ? String(row.amount) : '',
    frequency: row.frequency || 'monthly',
  };
}

/**
 * Restore utility selections from saved housing (new or legacy shape).
 * @param {object|null|undefined} saved
 * @returns {object[]}
 */
export function migrateUtilityItemsFromHousing(saved) {
  if (!saved) return [];

  if (Array.isArray(saved.utilityItems) && saved.utilityItems.length > 0) {
    return saved.utilityItems.map(normalizeUtilityItem);
  }

  const items = [];

  if (saved.utilitiesMode === 'itemized' && saved.utilityBreakdown) {
    Object.entries(saved.utilityBreakdown).forEach(([legacyKey, val]) => {
      if (val == null || val === '' || parseFloat(val) <= 0) return;
      items.push(normalizeUtilityItem({ key: legacyKey, amount: val, frequency: 'monthly' }));
    });
  }

  if (Array.isArray(saved.utilityOtherRows)) {
    saved.utilityOtherRows.forEach((row, i) => {
      if (!row?.amount && !row?.label) return;
      items.push(normalizeUtilityItem({
        id: `util_other_migrated_${i}`,
        key: 'other',
        category: UTILITY_CATEGORY_ORDER[0],
        customLabel: row.label || '',
        amount: row.amount,
        frequency: row.frequency || 'monthly',
      }));
    });
  }

  return items;
}

/**
 * @param {object[]} items
 * @returns {number}
 */
export function computeUtilitiesMonthlyTotal(items) {
  return (items || []).reduce(
    (sum, item) => sum + toMonthly(parseFloat(item.amount) || 0, item.frequency || 'monthly'),
    0,
  );
}
