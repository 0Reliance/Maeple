import { idbFallback } from './IndexedDBFallback';

/**
 * Storage wrapper that provides localStorage with IndexedDB fallback
 * Automatically switches to IndexedDB if localStorage fails (e.g., private browsing mode)
 */
class StorageWrapper {
  private useIndexedDB = false;

  async getItem(key: string): Promise<string | null> {
    if (this.useIndexedDB) {
      try {
        return await idbFallback.getItem(key);
      } catch {
        // If IndexedDB also fails, return null
        return null;
      }
    }

    try {
      const value = localStorage.getItem(key);
      return value;
    } catch (error) {
      console.warn('[StorageWrapper] localStorage.getItem failed, switching to IndexedDB:', error);
      this.useIndexedDB = true;
      try {
        return await idbFallback.getItem(key);
      } catch (idbError) {
        console.error('[StorageWrapper] IndexedDB also failed:', idbError);
        return null;
      }
    }
  }

  async setItem(key: string, value: string): Promise<boolean> {
    if (this.useIndexedDB) {
      try {
        await idbFallback.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('[StorageWrapper] localStorage.setItem failed, switching to IndexedDB:', error);
      this.useIndexedDB = true;
      try {
        await idbFallback.setItem(key, value);
        return true;
      } catch (idbError) {
        console.error('[StorageWrapper] IndexedDB also failed:', idbError);
        return false;
      }
    }
  }

  async removeItem(key: string): Promise<boolean> {
    if (this.useIndexedDB) {
      try {
        await idbFallback.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('[StorageWrapper] localStorage.removeItem failed, switching to IndexedDB:', error);
      this.useIndexedDB = true;
      try {
        await idbFallback.removeItem(key);
        return true;
      } catch (idbError) {
        console.error('[StorageWrapper] IndexedDB also failed:', idbError);
        return false;
      }
    }
  }

  async clear(): Promise<boolean> {
    if (this.useIndexedDB) {
      try {
        await idbFallback.clear();
        return true;
      } catch {
        return false;
      }
    }

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('[StorageWrapper] localStorage.clear failed, switching to IndexedDB:', error);
      this.useIndexedDB = true;
      try {
        await idbFallback.clear();
        return true;
      } catch (idbError) {
        console.error('[StorageWrapper] IndexedDB also failed:', idbError);
        return false;
      }
    }
  }

  /**
   * Check if currently using IndexedDB fallback
   */
  isUsingFallback(): boolean {
    return this.useIndexedDB;
  }
}

export const storageWrapper = new StorageWrapper();