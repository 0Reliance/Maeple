/**
 * Service Result Cache
 * Caches API responses to reduce redundant calls and improve performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
};

class ServiceCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private config: CacheConfig;
  private cleanupInterval: number;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Clean up expired entries every minute
    this.cleanupInterval = window.setInterval(
      () => this.cleanup(),
      60 * 1000
    );
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(prefix: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, unknown>);

    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Get cached value
   */
  get<T>(prefix: string, params: Record<string, unknown> = {}): T | null {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(
    prefix: string,
    data: T,
    params: Record<string, unknown> = {},
    customTTL?: number
  ): void {
    const key = this.generateKey(prefix, params);
    const ttl = customTTL || this.config.ttl;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });

    // Enforce max size
    this.enforceMaxSize();
  }

  /**
   * Check if cached value exists and is fresh
   */
  has(prefix: string, params: Record<string, unknown> = {}): boolean {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    return Date.now() <= entry.expiresAt;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(prefix: string, params: Record<string, unknown> = {}): void {
    const key = this.generateKey(prefix, params);
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries with specific prefix
   */
  invalidatePrefix(prefix: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${prefix}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Enforce maximum cache size
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.config.maxSize) {
      return;
    }

    // Convert to array and sort by timestamp
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest entries
    const toRemove = this.cache.size - this.config.maxSize;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: { key: string; expiresAt: number }[];
  } {
    const entries = Array.from(this.cache.entries());
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need tracking to implement
      entries: entries.map(([key, entry]) => ({
        key,
        expiresAt: entry.expiresAt,
      })),
    };
  }

  /**
   * Persist cache to localStorage
   */
  persist(): void {
    try {
      const serializable = Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        ...entry,
      }));
      
      localStorage.setItem('serviceCache', JSON.stringify(serializable));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  load(): void {
    try {
      const persisted = localStorage.getItem('serviceCache');
      if (!persisted) {
        return;
      }

      const entries = JSON.parse(persisted) as Array<{
        key: string;
        data: unknown;
        timestamp: number;
        expiresAt: number;
      }>;

      // Filter out expired entries
      const now = Date.now();
      entries.forEach(entry => {
        if (now <= entry.expiresAt) {
          this.cache.set(entry.key, entry);
        }
      });
    } catch (error) {
      console.warn('Failed to load cache:', error);
    }
  }

  /**
   * Destroy cache and cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Singleton instances with different configurations
export const shortCache = new ServiceCache({ ttl: 60 * 1000 }); // 1 minute
export const mediumCache = new ServiceCache({ ttl: 5 * 60 * 1000 }); // 5 minutes
export const longCache = new ServiceCache({ ttl: 30 * 60 * 1000 }); // 30 minutes

// Load persisted cache on initialization
shortCache.load();
mediumCache.load();
longCache.load();

// Persist cache periodically (every 5 minutes)
setInterval(() => {
  shortCache.persist();
  mediumCache.persist();
  longCache.persist();
}, 5 * 60 * 1000);

export default ServiceCache;