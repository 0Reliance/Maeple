/**
 * Multi-layer Caching Service
 * L1: Memory cache (instant access)
 * L2: IndexedDB (fast, persistent)
 * L3: Network (fallback)
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CacheDB extends DBSchema {
  cache: {
    key: string;
    value: {
      data: unknown;
      timestamp: number;
      expiresAt: number;
    };
  };
}

export interface CacheOptions {
  ttl?: number;              // Time to live in milliseconds
  memoryOnly?: boolean;       // Only use memory cache
  refreshInBackground?: boolean; // Refresh in background when expired
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private db: IDBPDatabase<CacheDB> | null = null;
  private readonly MEMORY_MAX_SIZE = 50; // Max entries in memory cache
  private readonly DEFAULT_TTL = 3600000; // 1 hour default

  constructor() {
    this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    try {
      this.db = await openDB<CacheDB>('maeple-cache', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache');
          }
        },
      });
      console.log('[CacheService] IndexedDB initialized');
    } catch (error) {
      console.error('[CacheService] Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Get cached value
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    // Try memory cache first (L1)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      if (import.meta.env.DEV) {
        console.log(`[CacheService] L1 hit: ${key}`);
      }
      return memoryEntry.data as T;
    }

    // Try IndexedDB (L2)
    if (!options.memoryOnly && this.db) {
      try {
        const dbEntry = await this.db.get('cache', key);
        if (dbEntry && !this.isExpired(dbEntry)) {
          // Promote to memory cache
          this.memoryCache.set(key, dbEntry as CacheEntry<unknown>);
          if (import.meta.env.DEV) {
            console.log(`[CacheService] L2 hit: ${key}`);
          }
          return dbEntry.data as T;
        }
      } catch (error) {
        console.error('[CacheService] Failed to read from IndexedDB:', error);
      }
    }

    if (import.meta.env.DEV) {
      console.log(`[CacheService] Miss: ${key}`);
    }
    return null;
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.DEFAULT_TTL;
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    // Store in memory cache (L1)
    this.setMemoryCache(key, entry);

    // Store in IndexedDB (L2)
    if (!options.memoryOnly && this.db) {
      try {
        await this.db.put('cache', entry, key);
        if (import.meta.env.DEV) {
          console.log(`[CacheService] Cached: ${key} (TTL: ${ttl}ms)`);
        }
      } catch (error) {
        console.error('[CacheService] Failed to write to IndexedDB:', error);
      }
    }
  }

  /**
   * Get or set pattern - fetch if not cached
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetcher();

    // Store in cache
    await this.set(key, fresh, options);

    return fresh;
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    // Remove from memory cache
    this.memoryCache.delete(key);

    // Remove from IndexedDB
    if (this.db) {
      try {
        await this.db.delete('cache', key);
      } catch (error) {
        console.error('[CacheService] Failed to delete from IndexedDB:', error);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear IndexedDB
    if (this.db) {
      try {
        await this.db.clear('cache');
        console.log('[CacheService] Cache cleared');
      } catch (error) {
        console.error('[CacheService] Failed to clear IndexedDB:', error);
      }
    }
  }

  /**
   * Clear expired entries
   */
  async clearExpired(): Promise<void> {
    // Clear expired from memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear expired from IndexedDB
    if (this.db) {
      try {
        const allKeys = await this.db.getAllKeys('cache');
        for (const key of allKeys) {
          const entry = await this.db.get('cache', key);
          if (entry && this.isExpired(entry)) {
            await this.db.delete('cache', key);
          }
        }
        console.log('[CacheService] Expired entries cleared');
      } catch (error) {
        console.error('[CacheService] Failed to clear expired entries:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memorySize: number;
    dbSize: number;
    keys: string[];
  }> {
    const memorySize = this.memoryCache.size;
    const keys = Array.from(this.memoryCache.keys());

    let dbSize = 0;
    if (this.db) {
      try {
        dbSize = await this.db.count('cache');
      } catch (error) {
        console.error('[CacheService] Failed to get DB size:', error);
      }
    }

    return { memorySize, dbSize, keys };
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Set value in memory cache with size limit
   */
  private setMemoryCache<T>(key: string, entry: CacheEntry<T>): void {
    // Remove oldest entry if at capacity
    if (this.memoryCache.size >= this.MEMORY_MAX_SIZE) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, entry);
  }

  /**
   * Invalidate cache by prefix
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from IndexedDB
    if (this.db) {
      try {
        const allKeys = await this.db.getAllKeys('cache');
        for (const key of allKeys) {
          if (key.startsWith(prefix)) {
            await this.db.delete('cache', key);
          }
        }
      } catch (error) {
        console.error('[CacheService] Failed to invalidate by prefix:', error);
      }
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Auto-clear expired entries every 5 minutes
setInterval(() => {
  cacheService.clearExpired();
}, 300000);