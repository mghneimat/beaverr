import {
  LEGACY_SERVICE_CATEGORY,
  OTHER_COST_MIGRATION_CATEGORY,
} from './subscriptionCatalog';

/**
 * Normalize a legacy subscription row to the new shape.
 * @param {object} row
 * @returns {object}
 */
export function normalizeSubscriptionRow(row) {
  const serviceKey = row.serviceKey || row.name || 'other';
  let category = row.category ?? LEGACY_SERVICE_CATEGORY[serviceKey] ?? null;
  if (category === undefined) category = null;

  return {
    id: row.id || `sub_${serviceKey}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    serviceKey,
    customName: row.customName || (serviceKey === 'other' ? row.name : '') || '',
    category,
    cost: row.cost ?? row.amount ?? '',
    frequency: row.frequency || 'monthly',
    chargeDay: row.chargeDay ? String(row.chargeDay) : '',
    autoRenews: row.autoRenews !== false,
    endDate: row.endDate || row.renewalDate || row.dueDate || '',
    nextPaymentOverride: row.nextPaymentOverride || '',
  };
}

/** @param {object|null|undefined} sub */
export function isSubscriptionIncluded(sub) {
  return sub?.enabled !== false;
}

/**
 * Migrate other-costs entries into subscription rows.
 * @param {object[]} otherCosts
 * @returns {object[]}
 */
export function migrateOtherCostsToSubscriptions(otherCosts) {
  if (!Array.isArray(otherCosts)) return [];

  return otherCosts
    .filter((row) => row.name !== 'charity')
    .map((row) => {
      const chipKey = row.name;
      const category = OTHER_COST_MIGRATION_CATEGORY[chipKey] ?? null;
      const isCustom = chipKey === 'other' || !OTHER_COST_MIGRATION_CATEGORY[chipKey];

      return normalizeSubscriptionRow({
        id: `migrated_${chipKey}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        serviceKey: isCustom ? 'other' : chipKey,
        customName: isCustom ? (row.customName || row.label || '') : '',
        category,
        cost: row.amount ?? row.cost ?? '',
        frequency: row.frequency || 'monthly',
        chargeDay: row.chargeDay || '',
        autoRenews: row.autoRenews !== false,
        endDate: row.dueDate || row.endDate || '',
      });
    });
}

/**
 * Load subscriptions with one-time migration from other-costs.
 * @param {object[]|null} subs
 * @param {object[]|null} otherCosts
 * @param {boolean} otherCostsMigrated
 * @returns {{ subscriptions: object[], migrated: boolean }}
 */
export function loadSubscriptionsWithMigration(subs, otherCosts, otherCostsMigrated) {
  let subscriptions = Array.isArray(subs) ? subs.map(normalizeSubscriptionRow) : [];

  if (!otherCostsMigrated && Array.isArray(otherCosts) && otherCosts.length > 0) {
    const migrated = migrateOtherCostsToSubscriptions(otherCosts);
    subscriptions = [...subscriptions, ...migrated];
    return { subscriptions, migrated: true };
  }

  return { subscriptions, migrated: false };
}
