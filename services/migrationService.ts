/**
 * MAEPLE Data Migration Service
 * 
 * Migrates user data from POZIMIND (legacy) keys to MAEPLE keys.
 * Ensures users don't lose their data after the rebrand.
 * 
 * Note: MAEPLE is codenamed POZIMIND, brought to you by Pozi, part of the Poziverse.
 */

interface MigrationConfig {
  from: string;
  to: string;
}

const LOCAL_STORAGE_MIGRATIONS: MigrationConfig[] = [
  { from: 'pozimind_entries', to: 'maeple_entries' },
  { from: 'pozimind_user_settings', to: 'maeple_user_settings' },
  { from: 'pozimind_key', to: 'maeple_key' },
  { from: 'pozimind_ai_settings', to: 'maeple_ai_settings' },
  { from: 'healthflow_wearable_config', to: 'maeple_wearable_config' },
];

const IDB_MIGRATIONS = [
  { from: 'pozimind_db', to: 'maeple_db' },
  { from: 'pozimind-offline', to: 'maeple-offline' },
];

/**
 * Run all data migrations from POZIMIND to MAEPLE
 * Safe to call multiple times - only runs once
 */
export const runMigration = async (): Promise<void> => {
  // Check if migration already completed
  const migrationComplete = localStorage.getItem('maeple_migration_complete');
  if (migrationComplete) {
    console.log('MAEPLE migration already completed');
    return;
  }

  console.log('Starting MAEPLE data migration...');

  try {
    // 1. Migrate LocalStorage keys
    await migrateLocalStorage();

    // 2. Migrate API key prefix (pozimind_ai_key_* → maeple_ai_key_*)
    await migrateApiKeyPrefix();

    // 3. Migrate IndexedDB databases
    await migrateIndexedDB();

    // 4. Mark migration complete
    localStorage.setItem('maeple_migration_complete', new Date().toISOString());
    console.log('MAEPLE migration completed successfully');
  } catch (error) {
    console.error('MAEPLE migration error:', error);
    // Don't throw - app should continue to function even if migration fails
  }
};

/**
 * Migrate LocalStorage keys from pozimind_* to maeple_*
 */
const migrateLocalStorage = async (): Promise<void> => {
  for (const { from, to } of LOCAL_STORAGE_MIGRATIONS) {
    const value = localStorage.getItem(from);
    if (value) {
      const existingNew = localStorage.getItem(to);
      if (!existingNew) {
        localStorage.setItem(to, value);
        console.log(`Migrated ${from} → ${to}`);
      }
      // Keep old key for now (users might downgrade)
    }
  }
};

/**
 * Migrate API key prefix from pozimind_ai_key_* to maeple_ai_key_*
 */
const migrateApiKeyPrefix = (): void => {
  const keysToMigrate: { oldKey: string; newKey: string; value: string }[] = [];

  // Collect all keys to migrate (don't modify during iteration)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('pozimind_ai_key_')) {
      const newKey = key.replace('pozimind_ai_key_', 'maeple_ai_key_');
      const value = localStorage.getItem(key);
      if (value) {
        keysToMigrate.push({ oldKey: key, newKey, value });
      }
    }
  }

  // Now migrate
  for (const { oldKey, newKey, value } of keysToMigrate) {
    const existingNew = localStorage.getItem(newKey);
    if (!existingNew) {
      localStorage.setItem(newKey, value);
      console.log(`Migrated ${oldKey} → ${newKey}`);
    }
  }
};

/**
 * Migrate IndexedDB databases from pozimind_* to maeple_*
 * This is critical for preserving encrypted bio-mirror data and offline cache
 */
const migrateIndexedDB = async (): Promise<void> => {
  try {
    for (const { from, to } of IDB_MIGRATIONS) {
      await migrateDatabase(from, to);
    }
  } catch (error) {
    console.error('IndexedDB migration error:', error);
    // Don't throw - offline functionality can be re-created
  }
};

/**
 * Copy all data from one IndexedDB database to another
 */
const migrateDatabase = async (fromName: string, toName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if source database exists
    const dbRequest = indexedDB.open(fromName);

    dbRequest.onerror = () => {
      // Source database doesn't exist - nothing to migrate
      resolve();
    };

    dbRequest.onsuccess = (event) => {
      const sourceDb = (event.target as IDBOpenDBRequest).result;
      const objectStoreNames = Array.from(sourceDb.objectStoreNames);

      if (objectStoreNames.length === 0) {
        sourceDb.close();
        resolve();
        return;
      }

      // Open/create target database with same schema
      const targetRequest = indexedDB.open(toName);
      let targetDb: IDBDatabase;

      targetRequest.onupgradeneeded = (event) => {
        const tdb = (event.target as IDBOpenDBRequest).result;
        // Create object stores in target
        for (const storeName of objectStoreNames) {
          if (!tdb.objectStoreNames.contains(storeName)) {
            tdb.createObjectStore(storeName, { keyPath: 'id' });
          }
        }
      };

      targetRequest.onsuccess = (event) => {
        targetDb = (event.target as IDBOpenDBRequest).result;
        let migratedStores = 0;

        // Copy data from source to target
        for (const storeName of objectStoreNames) {
          const sourceTransaction = sourceDb.transaction([storeName], 'readonly');
          const sourceStore = sourceTransaction.objectStore(storeName);
          const getAllRequest = sourceStore.getAll();

          getAllRequest.onsuccess = () => {
            const data = getAllRequest.result;
            const targetTransaction = targetDb.transaction([storeName], 'readwrite');
            const targetStore = targetTransaction.objectStore(storeName);

            for (const item of data) {
              const existsRequest = targetStore.get(item.id);
              existsRequest.onsuccess = () => {
                if (!existsRequest.result) {
                  // Only add if doesn't exist in target
                  targetStore.add(item);
                }
              };
            }

            targetTransaction.oncomplete = () => {
              migratedStores++;
              if (migratedStores === objectStoreNames.length) {
                sourceDb.close();
                targetDb.close();
                console.log(`Migrated IndexedDB: ${fromName} → ${toName}`);
                resolve();
              }
            };
          };
        }
      };

      targetRequest.onerror = () => {
        sourceDb.close();
        reject(new Error(`Failed to open target IndexedDB: ${toName}`));
      };
    };
  });
};

/**
 * Clean up legacy POZIMIND data keys
 * Call this in a future version after users have had time to migrate
 */
export const cleanupLegacyData = (): void => {
  const legacyKeys = [
    'pozimind_entries',
    'pozimind_user_settings',
    'pozimind_key',
    'pozimind_ai_settings',
    'healthflow_wearable_config',
  ];

  for (const key of legacyKeys) {
    localStorage.removeItem(key);
    console.log(`Cleaned up legacy key: ${key}`);
  }

  // Also clean up API keys
  const keysToClean: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('pozimind_ai_key_')) {
      keysToClean.push(key);
    }
  }

  for (const key of keysToClean) {
    localStorage.removeItem(key);
    console.log(`Cleaned up legacy API key: ${key}`);
  }
};
