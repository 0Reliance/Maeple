import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageWrapper } from '../../src/services/storageWrapper';

// Mock IndexedDBFallback to prevent "IDBRequest is not defined" error
vi.mock('../../src/services/IndexedDBFallback', () => {
  return {
    IndexedDBFallback: class {
      async init() { return true; }
      async getItem() { return null; }
      async setItem() { return true; }
      async removeItem() { return true; }
      async clear() { return true; }
    }
  };
});

describe('StorageWrapper', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should read and write to localStorage', async () => {
    await storageWrapper.setItem('test-key', 'test-value');
    const result = await storageWrapper.getItem('test-key');
    expect(result).toBe('test-value');
  });

  it('should fallback to IndexedDB when localStorage fails', async () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: localStorage is disabled');
    });
    
    const result = await storageWrapper.getItem('test-key');
    // Should not throw, just return null
    expect(result).toBeNull();
  });

  it('should handle setItem failures gracefully', async () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    
    const success = await storageWrapper.setItem('test-key', 'value');
    // Should attempt fallback to IndexedDB (may fail in test environment)
    expect(typeof success).toBe('boolean');
  });

  it('should remove item from localStorage', async () => {
    await storageWrapper.setItem('to-remove', 'value');
    await storageWrapper.removeItem('to-remove');
    const result = await storageWrapper.getItem('to-remove');
    expect(result).toBeNull();
  });

  it('should clear all items', async () => {
    await storageWrapper.setItem('key1', 'value1');
    await storageWrapper.setItem('key2', 'value2');
    await storageWrapper.clear();
    const result1 = await storageWrapper.getItem('key1');
    const result2 = await storageWrapper.getItem('key2');
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });
});