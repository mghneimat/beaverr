import { migrateLegacyStorageKeys } from '../../lib/beaverrStorageMigration';
import { STORAGE_KEYS } from '../../lib/beaverrConstants';

describe('beaverrStorageMigration', () => {
  /** @type {import('../storage').StorageAdapter} */
  let mock;

  beforeEach(() => {
    /** @type {Record<string, string>} */
    const store = {};
    mock = {
      getItem: async (key) => (store[key] ?? null),
      setItem: async (key, value) => { store[key] = value; },
      removeItem: async (key) => { delete store[key]; },
    };
  });

  test('copies pocketos_household to beaverr_household and removes legacy', async () => {
    await mock.setItem('pocketos_household', JSON.stringify({ type: 'partner' }));

    const migrated = await migrateLegacyStorageKeys(mock);

    expect(migrated).toBe(true);
    expect(await mock.getItem('beaverr_household')).toBe(JSON.stringify({ type: 'partner' }));
    expect(await mock.getItem('pocketos_household')).toBeNull();
    expect(await mock.getItem(STORAGE_KEYS.storageMigrated)).toBe('true');
  });

  test('does not overwrite existing beaverr key', async () => {
    await mock.setItem('pocketos_household', JSON.stringify({ type: 'solo' }));
    await mock.setItem('beaverr_household', JSON.stringify({ type: 'partner' }));

    await migrateLegacyStorageKeys(mock);

    expect(await mock.getItem('beaverr_household')).toBe(JSON.stringify({ type: 'partner' }));
    expect(await mock.getItem('pocketos_household')).toBeNull();
  });

  test('skips when already migrated', async () => {
    await mock.setItem(STORAGE_KEYS.storageMigrated, 'true');
    await mock.setItem('pocketos_household', JSON.stringify({ type: 'solo' }));

    const migrated = await migrateLegacyStorageKeys(mock);

    expect(migrated).toBe(false);
    expect(await mock.getItem('pocketos_household')).toBe(JSON.stringify({ type: 'solo' }));
  });
});
