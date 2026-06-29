/**
 * Map auto sinking-fund source keys to breakdown section icon keys.
 * @param {string|null|undefined} sourceKey
 * @returns {string}
 */
export function commitmentIconSectionKey(sourceKey) {
  const type = sourceKey?.split(':')[0];
  switch (type) {
    case 'health_insurance':
      return 'health';
    case 'vehicle_insurance':
    case 'vehicle_mot':
    case 'vehicle_parking':
    case 'vehicle_vignette':
    case 'vehicle_maintenance':
      return 'transport';
    case 'pet_insurance':
      return 'pets';
    case 'subscription':
      return 'subscriptions';
    case 'residence_permit':
      return 'user';
    case 'govt_tax':
    case 'housing_other':
      return 'housing';
    case 'child_cost':
      return 'children';
    default:
      return 'other';
  }
}
