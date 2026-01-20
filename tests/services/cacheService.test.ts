/**
 * Unit Tests for Cache Service
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { cacheService } from '../../src/services/cacheService';

// Mock IndexedDB
const mockDB = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  count: vi.fn(),
  getAllKeys: vi.fn(),
  objectStore: {
    contains: vi.fn()
  }
};

// Mock openDB
vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve({
    get: (storeName: string, key: string) => mockDB.get(storeName, key),
    put: (storeName: string, value: any, key: string) => mockDB.put(storeName, value, key),
    delete: (storeName: string, key: string) => mockDB.delete(storeName, key),
    clear: (storeName: string) => mockDB.clear(storeName),
    count: (storeName: string) => mockDB.count(storeName),
    getAllKeys: (storeName: string) => mockDB.getAllKeys(storeName),
    close: vi.fn()
  }))
}));

describe('cacheService', () => {
  beforeAll(async () => {
    // Wait for async constructor to finish initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset mockDB
    mockDB.get.mockReset();
    mockDB.put.mockReset();
    mockDB.delete.mockReset();
    mockDB.clear.mockReset();
    mockDB.count.mockReset();
    mockDB.getAllKeys.mockReset();
    
    // Clear cache state
    await cacheService.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      mockDB.get.mockResolvedValue(undefined);
      
      const result = await cacheService.get('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('should return cached value for existing key', async () => {
      const mockValue = {
        data: 'test-value',
        timestamp: Date.now(),
        expiresAt: Date.now() + 3600000
      };
      mockDB.get.mockResolvedValue(mockValue);
      
      const result = await cacheService.get('existing-key');
      
      expect(result).toBe('test-value');
    });

    it('should return null for expired entry', async () => {
      const expiredValue = {
        data: 'expired',
        timestamp: Date.now() - 7200000,
        expiresAt: Date.now() - 3600000
      };
      mockDB.get.mockResolvedValue(expiredValue);
      
      const result = await cacheService.get('expired-key');
      
      expect(result).toBeNull();
    });

    it('should return null for memory-only cache when DB not initialized', async () => {
      mockDB.get.mockResolvedValue(undefined);
      
      const result = await cacheService.get('key', { memoryOnly: true });
      
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value in memory cache', async () => {
      mockDB.put.mockResolvedValue(undefined);
      
      await cacheService.set('test-key', 'test-value');
      
      const stats = await cacheService.getStats();
      expect(stats.keys).toContain('test-key');
    });

    it('should use default TTL when not provided', async () => {
      mockDB.put.mockResolvedValue(undefined);
      const beforeTime = Date.now();
      
      await cacheService.set('test-key', 'test-value');
      
      const call = mockDB.put.mock.calls[0];
      const entry = call[1] as any;
      expect(entry.expiresAt).toBeGreaterThanOrEqual(beforeTime + 3600000);
      expect(entry.expiresAt).toBeLessThanOrEqual(beforeTime + 3600100);
    });

    it('should use custom TTL when provided', async () => {
      mockDB.put.mockResolvedValue(undefined);
      const beforeTime = Date.now();
      
      await cacheService.set('test-key', 'test-value', { ttl: 5000 });
      
      const call = mockDB.put.mock.calls[0];
      const entry = call[1] as any;
      expect(entry.expiresAt).toBeGreaterThanOrEqual(beforeTime + 5000);
      expect(entry.expiresAt).toBeLessThanOrEqual(beforeTime + 5100);
    });

    it('should skip DB for memory-only cache', async () => {
      await cacheService.set('test-key', 'test-value', { memoryOnly: true });
      
      expect(mockDB.put).not.toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const mockValue = {
        data: 'cached-value',
        timestamp: Date.now(),
        expiresAt: Date.now() + 3600000
      };
      mockDB.get.mockResolvedValue(mockValue);
      
      const fetcher = vi.fn().mockResolvedValue('fresh-value');
      const result = await cacheService.getOrSet('cached-key', fetcher);
      
      expect(result).toBe('cached-value');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should call fetcher when cache miss', async () => {
      mockDB.get.mockResolvedValue(undefined);
      
      const fetcher = vi.fn().mockResolvedValue('fresh-value');
      mockDB.put.mockResolvedValue(undefined);
      
      const result = await cacheService.getOrSet('new-key', fetcher);
      
      expect(result).toBe('fresh-value');
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(mockDB.put).toHaveBeenCalled();
    });

    it('should cache fetcher result', async () => {
      mockDB.get.mockResolvedValue(undefined);
      
      const fetcher = vi.fn().mockResolvedValue('fresh-value');
      mockDB.put.mockResolvedValue(undefined);
      
      await cacheService.getOrSet('new-key', fetcher);
      
      expect(mockDB.put).toHaveBeenCalledWith(
        'cache',
        expect.objectContaining({
          data: 'fresh-value'
        }),
        'new-key'
      );
    });
  });

  describe('delete', () => {
    it('should delete from memory cache', async () => {
      await cacheService.set('delete-key', 'value');
      
      await cacheService.delete('delete-key');
      
      const stats = await cacheService.getStats();
      expect(stats.keys).not.toContain('delete-key');
    });

    it('should delete from DB', async () => {
      await cacheService.delete('db-key');
      
      expect(mockDB.delete).toHaveBeenCalledWith('cache', 'db-key');
    });
  });

  describe('clear', () => {
    it('should clear memory cache', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      
      await cacheService.clear();
      
      const stats = await cacheService.getStats();
      expect(stats.memorySize).toBe(0);
      expect(stats.keys).toHaveLength(0);
    });

    it('should clear DB', async () => {
      await cacheService.clear();
      
      expect(mockDB.clear).toHaveBeenCalledWith('cache');
    });
  });

  describe('getStats', () => {
    it('should return memory cache size', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');
      
      const stats = await cacheService.getStats();
      
      expect(stats.memorySize).toBe(3);
    });

    it('should return DB size', async () => {
      mockDB.count.mockResolvedValue(42);
      
      const stats = await cacheService.getStats();
      
      expect(stats.dbSize).toBe(42);
    });

    it('should return all memory cache keys', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      
      const stats = await cacheService.getStats();
      
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });

    it('should return zero for empty cache', async () => {
      mockDB.count.mockResolvedValue(0);
      
      const stats = await cacheService.getStats();
      
      expect(stats.memorySize).toBe(0);
      expect(stats.dbSize).toBe(0);
      expect(stats.keys).toHaveLength(0);
    });
  });

  describe('invalidateByPrefix', () => {
    it('should remove all keys with prefix', async () => {
      await cacheService.set('user:123', 'value1');
      await cacheService.set('user:456', 'value2');
      await cacheService.set('cache:abc', 'value3');
      
      await cacheService.invalidateByPrefix('user:');
      
      const stats = await cacheService.getStats();
      expect(stats.keys).not.toContain('user:123');
      expect(stats.keys).not.toContain('user:456');
      expect(stats.keys).toContain('cache:abc');
    });

    it('should call DB delete for matching keys', async () => {
      mockDB.getAllKeys.mockResolvedValue(['user:1', 'user:2', 'cache:3']);
      
      await cacheService.invalidateByPrefix('user:');
      
      expect(mockDB.delete).toHaveBeenCalledWith('cache', 'user:1');
      expect(mockDB.delete).toHaveBeenCalledWith('cache', 'user:2');
      expect(mockDB.delete).not.toHaveBeenCalledWith('cache', 'cache:3');
    });
  });

  describe('memory cache size limit', () => {
    it('should not exceed max size (50 entries)', async () => {
      // Add 55 entries
      for (let i = 0; i < 55; i++) {
        await cacheService.set(`key${i}`, `value${i}`);
      }
      
      const stats = await cacheService.getStats();
      expect(stats.memorySize).toBeLessThanOrEqual(50);
    });

    it('should remove oldest entry when at capacity', async () => {
      // Fill cache to capacity
      for (let i = 0; i < 51; i++) {
        await cacheService.set(`key${i}`, `value${i}`);
      }
      
      const stats = await cacheService.getStats();
      // Oldest key should be removed
      expect(stats.keys).not.toContain('key0');
      // Most recent keys should be present
      expect(stats.keys).toContain('key50');
    });
  });
});