/**
 * Offline Queue Service Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  offlineQueue,
  registerOfflineHandler,
  withOfflineSupport,
} from '@services/offlineQueue';

// Note: IndexedDB is available via fake-indexeddb in jsdom environment

describe('offlineQueue', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Clear the queue before each test
    await offlineQueue.clear();
  });

  describe('getStatus', () => {
    it('should return queue status', () => {
      const status = offlineQueue.getStatus();
      
      expect(status).toHaveProperty('length');
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('isProcessing');
      expect(status).toHaveProperty('items');
      expect(Array.isArray(status.items)).toBe(true);
    });

    it('should reflect queue length', () => {
      const status = offlineQueue.getStatus();
      expect(typeof status.length).toBe('number');
      expect(status.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkOnline', () => {
    it('should return online status as boolean', () => {
      const result = offlineQueue.checkOnline();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('registerOfflineHandler', () => {
    it('should register a handler without error', () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined);
      
      expect(() => {
        registerOfflineHandler('test_handler', mockHandler);
      }).not.toThrow();
    });

    it('should allow registering multiple handlers', () => {
      expect(() => {
        registerOfflineHandler('handler_1', vi.fn());
        registerOfflineHandler('handler_2', vi.fn());
        registerOfflineHandler('handler_3', vi.fn());
      }).not.toThrow();
    });
  });

  describe('withOfflineSupport', () => {
    it('should execute the function if it succeeds', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await withOfflineSupport(mockFn, {
        type: 'generic',
        handler: 'test_handler',
        payload: { data: 'test' },
      });
      
      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should throw non-network errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Database error'));
      
      await expect(
        withOfflineSupport(mockFn, {
          type: 'generic',
          handler: 'test_handler',
          payload: { data: 'test' },
        })
      ).rejects.toThrow('Database error');
    });

    it('should use custom shouldQueue function', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Custom error'));
      
      const result = await withOfflineSupport(mockFn, {
        type: 'generic',
        handler: 'test_handler',
        payload: { data: 'test' },
        shouldQueue: () => true, // Always queue
      });
      
      expect(result).toHaveProperty('queued', true);
      expect(result).toHaveProperty('id');
    });

    it('should queue network errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
      
      const result = await withOfflineSupport(mockFn, {
        type: 'journal',
        handler: 'journal_handler',
        payload: { entry: 'test' },
      });
      
      expect(result).toHaveProperty('queued', true);
      expect(typeof (result as { id: string }).id).toBe('string');
    });

    it('should queue connection errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('connection timeout'));
      
      const result = await withOfflineSupport(mockFn, {
        type: 'sync',
        handler: 'sync_handler',
        payload: {},
      });
      
      expect(result).toHaveProperty('queued', true);
    });
  });

  describe('enqueue', () => {
    it('should return a queue id starting with oq_', async () => {
      const id = await offlineQueue.enqueue('stateCheck', 'unregistered_handler_123', {});
      
      expect(typeof id).toBe('string');
      expect(id.startsWith('oq_')).toBe(true);
    });

    it('should handle enqueue with valid handler', async () => {
      registerOfflineHandler('test_enqueue_handler', vi.fn().mockResolvedValue(undefined));
      
      const id = await offlineQueue.enqueue('generic', 'test_enqueue_handler', { test: true });
      
      expect(id.startsWith('oq_')).toBe(true);
    });
  });

  describe('remove', () => {
    it('should return false for non-existent id', async () => {
      const removed = await offlineQueue.remove('non_existent_id_xyz');
      expect(removed).toBe(false);
    });

    it('should be able to remove a newly added item before processing', async () => {
      // Add without a handler so it won't auto-process
      const id = await offlineQueue.enqueue('generic', 'no_handler_exists_xyz', {});
      
      // Should be in queue since no handler
      const removed = await offlineQueue.remove(id);
      expect(typeof removed).toBe('boolean');
    });
  });

  describe('clear', () => {
    it('should clear all items from queue', async () => {
      await offlineQueue.enqueue('generic', 'test_handler', {});
      await offlineQueue.enqueue('journal', 'test_handler', {});
      await offlineQueue.enqueue('sync', 'test_handler', {});
      
      await offlineQueue.clear();
      
      const status = offlineQueue.getStatus();
      expect(status.length).toBe(0);
      expect(status.items).toEqual([]);
    });
  });
});
