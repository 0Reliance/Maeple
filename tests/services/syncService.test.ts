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
