import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pullFromCloud } from '../../src/services/syncService';
import * as apiClient from '../../src/services/apiClient';
import * as storageService from '../../src/services/storageService';
import * as authService from '../../src/services/authService';

vi.mock('../../src/services/apiClient');
vi.mock('../../src/services/storageService');
vi.mock('../../src/services/authService');

describe('SyncService Conflict Resolution', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(authService.isCloudSyncAvailable).mockReturnValue(true);
  });

  it('should resolve conflict using Last Write Wins (Cloud Wins)', async () => {
    const localEntry = { id: '1', timestamp: '2023-01-01T10:00:00Z', updatedAt: '2023-01-01T10:00:00Z' };
    const cloudEntry = { id: '1', timestamp: '2023-01-01T10:00:00Z', updatedAt: '2023-01-01T11:00:00Z' }; // Newer

    vi.mocked(storageService.getEntries).mockReturnValue([localEntry] as any);
    vi.mocked(apiClient.getEntries).mockResolvedValue({ entries: [cloudEntry] } as any);
    vi.mocked(apiClient.getSettings).mockResolvedValue({ settings: {} } as any);

    const result = await pullFromCloud();

    expect(result.success).toBe(true);
    // Should save cloud entry
    expect(storageService.bulkSaveEntries).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: '1', updatedAt: '2023-01-01T11:00:00Z' })])
    );
  });

  it('should resolve conflict using Last Write Wins (Local Wins)', async () => {
    const localEntry = { id: '1', timestamp: '2023-01-01T10:00:00Z', updatedAt: '2023-01-01T12:00:00Z' }; // Newer
    const cloudEntry = { id: '1', timestamp: '2023-01-01T10:00:00Z', updatedAt: '2023-01-01T11:00:00Z' };

    vi.mocked(storageService.getEntries).mockReturnValue([localEntry] as any);
    vi.mocked(apiClient.getEntries).mockResolvedValue({ entries: [cloudEntry] } as any);
    vi.mocked(apiClient.getSettings).mockResolvedValue({ settings: {} } as any);

    const result = await pullFromCloud();

    expect(result.success).toBe(true);
    // Should NOT call bulkSaveEntries because no changes needed
    expect(storageService.bulkSaveEntries).not.toHaveBeenCalled();
  });

  it('should add new entries from cloud', async () => {
    const localEntry = { id: '1', timestamp: '2023-01-01T10:00:00Z', updatedAt: '2023-01-01T10:00:00Z' };
    const cloudEntry = { id: '2', timestamp: '2023-01-02T10:00:00Z', updatedAt: '2023-01-02T10:00:00Z' }; // New

    vi.mocked(storageService.getEntries).mockReturnValue([localEntry] as any);
    vi.mocked(apiClient.getEntries).mockResolvedValue({ entries: [cloudEntry] } as any);
    vi.mocked(apiClient.getSettings).mockResolvedValue({ settings: {} } as any);

    const result = await pullFromCloud();

    expect(result.success).toBe(true);
    expect(storageService.bulkSaveEntries).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: '1' }),
        expect.objectContaining({ id: '2' })
      ])
    );
  });
});

describe('Sync Timeout Handling', () => {
  it('should timeout after SYNC_TIMEOUT_MS', async () => {
    // Mock a slow API call that never completes
    vi.mocked(apiClient.getEntries).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    // Mock isCloudSyncAvailable to return true
    vi.mocked(authService.isCloudSyncAvailable).mockReturnValue(true);
    
    // Add a pending change
    const pending = [
      {
        type: 'entry' as const,
        action: 'create' as const,
        id: 'test-id-1',
        timestamp: new Date().toISOString(),
      },
    ];
    localStorage.setItem('maeple_pending_sync', JSON.stringify(pending));
    
    // Process should timeout and not hang indefinitely
    const startTime = Date.now();
    
    try {
      const { processPendingChanges } = await import('../../src/services/syncService');
      await processPendingChanges();
      // Should have thrown timeout error
      expect(true).toBe(false);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      // Should timeout within 70 seconds (60s timeout + some buffer)
      expect(elapsed).toBeLessThan(70000);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Sync timeout');
    }
  });
});

describe('Queue Size Limits', () => {
  it('should enforce MAX_PENDING_CHANGES limit', () => {
    // Clear existing queue
    localStorage.removeItem('maeple_pending_sync');
    
    // Mock getEntries to return entries
    vi.mocked(storageService.getEntries).mockReturnValue([]);
    
    // Add more than MAX_PENDING_CHANGES (100)
    for (let i = 0; i < 105; i++) {
      const pending = JSON.parse(localStorage.getItem('maeple_pending_sync') || '[]');
      pending.push({
        type: 'entry' as const,
        action: 'create' as const,
        id: `test-id-${i}`,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('maeple_pending_sync', JSON.stringify(pending));
    }
    
    const pending = JSON.parse(localStorage.getItem('maeple_pending_sync') || '[]');
    // Should not exceed 100 due to queue limit
    expect(pending.length).toBeLessThanOrEqual(100);
  });
  
  it('should warn when queue is full', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock getEntries
    vi.mocked(storageService.getEntries).mockReturnValue([]);
    
    // Start with queue at limit
    const pending = [];
    for (let i = 0; i < 100; i++) {
      pending.push({
        type: 'entry' as const,
        action: 'create' as const,
        id: `test-id-${i}`,
        timestamp: new Date().toISOString(),
      });
    }
    localStorage.setItem('maeple_pending_sync', JSON.stringify(pending));
    
    // Try to add one more (should trigger warning)
    const pendingNow = JSON.parse(localStorage.getItem('maeple_pending_sync') || '[]');
    pendingNow.push({
      type: 'entry' as const,
      action: 'create' as const,
      id: 'test-id-101',
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('maeple_pending_sync', JSON.stringify(pendingNow));
    
    // Verify warning was logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Queue full')
    );
    
    consoleWarnSpy.mockRestore();
  });
});

describe('Stale Cleanup', () => {
  it('should remove entries older than 7 days on init', async () => {
    // Mock isCloudSyncAvailable to return false so sync doesn't run
    vi.mocked(authService.isCloudSyncAvailable).mockReturnValue(false);
    
    // Create pending changes with different ages
    const now = Date.now();
    const weekAndADayAgo = now - (8 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);
    
    const pending = [
      {
        type: 'entry' as const,
        action: 'create' as const,
        id: 'stale-entry-1',
        timestamp: new Date(weekAndADayAgo).toISOString(),
      },
      {
        type: 'entry' as const,
        action: 'create' as const,
        id: 'stale-entry-2',
        timestamp: new Date(weekAndADayAgo).toISOString(),
      },
      {
        type: 'entry' as const,
        action: 'create' as const,
        id: 'fresh-entry-1',
        timestamp: new Date(twoDaysAgo).toISOString(),
      },
      {
        type: 'entry' as const,
        action: 'create' as const,
        id: 'fresh-entry-2',
        timestamp: new Date(now).toISOString(),
      },
    ];
    
    localStorage.setItem('maeple_pending_sync', JSON.stringify(pending));
    
    // Initialize sync (should clean up stale entries)
    const { initializeSync } = await import('../../src/services/syncService');
    await initializeSync();
    
    // Check that stale entries were removed
    const remaining = JSON.parse(localStorage.getItem('maeple_pending_sync') || '[]');
    expect(remaining.length).toBe(2); // Only fresh entries remain
    
    const ids = remaining.map((p: any) => p.id);
    expect(ids).toContain('fresh-entry-1');
    expect(ids).toContain('fresh-entry-2');
    expect(ids).not.toContain('stale-entry-1');
    expect(ids).not.toContain('stale-entry-2');
  });
  
  it('should log warning when removing stale entries', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    vi.mocked(authService.isCloudSyncAvailable).mockReturnValue(false);
    
    // Create old entries
    const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
    const pending = [
      {
        type: 'entry' as const,
        action: 'create' as const,
        id: 'old-entry',
        timestamp: new Date(eightDaysAgo).toISOString(),
      },
    ];
    
    localStorage.setItem('maeple_pending_sync', JSON.stringify(pending));
    
    const { initializeSync } = await import('../../src/services/syncService');
    await initializeSync();
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Removed 1 stale pending changes')
    );
    
    consoleWarnSpy.mockRestore();
  });
});
