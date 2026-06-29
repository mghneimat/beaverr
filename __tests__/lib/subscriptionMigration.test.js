import { migrateOtherCostsToSubscriptions } from '../../lib/subscriptionMigration';

describe('migrateOtherCostsToSubscriptions', () => {
  it('does not migrate groceries or hairSalon into subscriptions', () => {
    const migrated = migrateOtherCostsToSubscriptions([
      { name: 'groceries', amount: 5000, frequency: 'monthly' },
      { name: 'hairSalon', amount: 500, frequency: 'monthly' },
    ]);
    expect(migrated).toHaveLength(0);
  });

  it('still migrates subscription-shaped other costs like gym', () => {
    const migrated = migrateOtherCostsToSubscriptions([
      { name: 'gym', amount: 800, frequency: 'monthly' },
    ]);
    expect(migrated).toHaveLength(1);
    expect(migrated[0].serviceKey).toBe('gym');
    expect(migrated[0].category).toBe('healthWellbeing');
  });
});
