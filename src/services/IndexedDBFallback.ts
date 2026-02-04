import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MaepleDB extends DBSchema {
  storage: {
    key: string;
    value: string;
  };
}

const DB_NAME = 'maeple_fallback';
const DB_VERSION = 1;
const STORE_NAME = 'storage';

/**
 * IndexedDB fallback for when localStorage fails
 * Used in private browsing mode or when localStorage is disabled
 */
export class IndexedDBFallback {
  private db: IDBPDatabase<MaepleDB> | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    try {
      this.db = await openDB<MaepleDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });
    } catch (error) {
      console.error('[IndexedDBFallback] Failed to initialize database:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      await this.init();
      const result = await this.db!.get(STORE_NAME, key);
      return result || null;
    } catch (error) {
      console.error('[IndexedDBFallback] Failed to get item:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.init();
      await this.db!.put(STORE_NAME, value, key);
    } catch (error) {
      console.error('[IndexedDBFallback] Failed to set item:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.init();
      await this.db!.delete(STORE_NAME, key);
    } catch (error) {
      console.error('[IndexedDBFallback] Failed to remove item:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.init();
      await this.db!.clear(STORE_NAME);
    } catch (error) {
      console.error('[IndexedDBFallback] Failed to clear storage:', error);
      throw error;
    }
  }

}

export const idbFallback = new IndexedDBFallback();