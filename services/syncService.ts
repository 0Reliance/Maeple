/**
 * MAEPLE Sync Service
 * 
 * Bridges local storage with Supabase cloud storage.
 * Implements a hybrid offline-first sync strategy:
 * - Always write to local first (instant, works offline)
 * - Sync to cloud in background when authenticated
 * - Pull from cloud on login to merge data
 */

import { HealthEntry, UserSettings } from '../types';
import { getEntries, getUserSettings, saveUserSettings, bulkSaveEntries } from './storageService';
import {
  cloudSaveEntry,
  cloudGetEntries,
  cloudBulkSaveEntries,
  cloudSaveSettings,
  cloudGetSettings,
  cloudGetSyncMetadata,
  cloudUpdateSyncMetadata,
  isSupabaseConfigured,
} from './supabaseStorage';
import { isCloudSyncAvailable } from './authService';

// ============================================
// SYNC STATE
// ============================================

export interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  lastSyncAt: Date | null;
  pendingChanges: number;
  error?: string;
}

let syncState: SyncState = {
  status: 'idle',
  lastSyncAt: null,
  pendingChanges: 0,
};

let syncListeners: Array<(state: SyncState) => void> = [];

// Pending changes queue (for offline support)
const PENDING_KEY = 'maeple_pending_sync';

interface PendingChange {
  type: 'entry' | 'settings' | 'stateCheck';
  action: 'create' | 'update' | 'delete';
  id: string;
  timestamp: string;
}

// ============================================
// STATE MANAGEMENT
// ============================================

export const getSyncState = (): SyncState => ({ ...syncState });

export const onSyncStateChange = (callback: (state: SyncState) => void): (() => void) => {
  syncListeners.push(callback);
  return () => {
    syncListeners = syncListeners.filter(cb => cb !== callback);
  };
};

const updateSyncState = (updates: Partial<SyncState>) => {
  syncState = { ...syncState, ...updates };
  syncListeners.forEach(cb => cb(syncState));
};

// ============================================
// PENDING CHANGES QUEUE
// ============================================

const getPendingChanges = (): PendingChange[] => {
  const stored = localStorage.getItem(PENDING_KEY);
  return stored ? JSON.parse(stored) : [];
};

const addPendingChange = (change: PendingChange) => {
  const pending = getPendingChanges();
  // Remove duplicates (same id and type)
  const filtered = pending.filter(p => !(p.id === change.id && p.type === change.type));
  filtered.push(change);
  localStorage.setItem(PENDING_KEY, JSON.stringify(filtered));
  updateSyncState({ pendingChanges: filtered.length });
};

const removePendingChange = (id: string, type: string) => {
  const pending = getPendingChanges();
  const filtered = pending.filter(p => !(p.id === id && p.type === type));
  localStorage.setItem(PENDING_KEY, JSON.stringify(filtered));
  updateSyncState({ pendingChanges: filtered.length });
};

const clearPendingChanges = () => {
  localStorage.removeItem(PENDING_KEY);
  updateSyncState({ pendingChanges: 0 });
};

// ============================================
// SYNC OPERATIONS
// ============================================

/**
 * Trigger sync of pending changes (called when auth state changes)
 */
export const triggerPendingSync = () => {
  if (isCloudSyncAvailable()) {
    processPendingChanges().catch(console.error);
  }
};

/**
 * Process all pending changes
 */
export const processPendingChanges = async (): Promise<void> => {
  if (!isCloudSyncAvailable()) {
    updateSyncState({ status: 'offline' });
    return;
  }

  const pending = getPendingChanges();
  if (pending.length === 0) {
    updateSyncState({ status: 'synced', pendingChanges: 0 });
    return;
  }

  updateSyncState({ status: 'syncing' });

  try {
    for (const change of pending) {
      if (change.type === 'entry') {
        if (change.action === 'delete') {
          // Delete is handled by cloudDeleteEntry in supabaseStorage
          // For now, skip - deletions sync on next full sync
        } else {
          const entries = getEntries();
          const entry = entries.find(e => e.id === change.id);
          if (entry) {
            await cloudSaveEntry(entry);
          }
        }
      } else if (change.type === 'settings') {
        const settings = getUserSettings();
        await cloudSaveSettings(settings);
      }
      
      removePendingChange(change.id, change.type);
    }

    await cloudUpdateSyncMetadata({
      lastSyncAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    updateSyncState({
      status: 'synced',
      lastSyncAt: new Date(),
      pendingChanges: 0,
    });
  } catch (error) {
    console.error('Sync error:', error);
    updateSyncState({
      status: 'error',
      error: error instanceof Error ? error.message : 'Sync failed',
    });
  }
};

/**
 * Full sync: Push all local data to cloud
 */
export const pushToCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  if (!isCloudSyncAvailable()) {
    return { success: false, count: 0, error: 'Not authenticated or Supabase not configured' };
  }

  updateSyncState({ status: 'syncing' });

  try {
    // Get all local data
    const entries = getEntries();
    const settings = getUserSettings();

    // Push entries
    const count = await cloudBulkSaveEntries(entries);

    // Push settings
    await cloudSaveSettings(settings);

    // Update sync metadata
    await cloudUpdateSyncMetadata({
      lastSyncAt: new Date().toISOString(),
      entriesSynced: count,
      syncStatus: 'synced',
    });

    clearPendingChanges();

    updateSyncState({
      status: 'synced',
      lastSyncAt: new Date(),
      pendingChanges: 0,
    });

    return { success: true, count };
  } catch (error) {
    console.error('Push to cloud error:', error);
    updateSyncState({
      status: 'error',
      error: error instanceof Error ? error.message : 'Push failed',
    });
    return { success: false, count: 0, error: error instanceof Error ? error.message : 'Push failed' };
  }
};

/**
 * Pull from cloud: Merge cloud data with local
 */
export const pullFromCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  if (!isCloudSyncAvailable()) {
    return { success: false, count: 0, error: 'Not authenticated or Supabase not configured' };
  }

  updateSyncState({ status: 'syncing' });

  try {
    // Get cloud data
    const cloudEntries = await cloudGetEntries(1000);
    const cloudSettings = await cloudGetSettings();

    // Get local data
    const localEntries = getEntries();
    const localIds = new Set(localEntries.map(e => e.id));

    // Merge: Add cloud entries that don't exist locally
    let addedCount = 0;
    const entriesToAdd: HealthEntry[] = [];
    
    for (const cloudEntry of cloudEntries) {
      if (!localIds.has(cloudEntry.id)) {
        entriesToAdd.push(cloudEntry);
        addedCount++;
      }
    }
    
    // Bulk save to avoid triggering individual syncs
    if (entriesToAdd.length > 0) {
      const merged = [...entriesToAdd, ...localEntries];
      bulkSaveEntries(merged);
    }

    // Merge settings (cloud wins for now - simple strategy)
    if (cloudSettings) {
      const localSettings = getUserSettings();
      saveUserSettings({
        ...localSettings,
        ...cloudSettings,
      }, true); // skipSync = true
    }

    updateSyncState({
      status: 'synced',
      lastSyncAt: new Date(),
    });

    return { success: true, count: addedCount };
  } catch (error) {
    console.error('Pull from cloud error:', error);
    updateSyncState({
      status: 'error',
      error: error instanceof Error ? error.message : 'Pull failed',
    });
    return { success: false, count: 0, error: error instanceof Error ? error.message : 'Pull failed' };
  }
};

/**
 * Full bidirectional sync
 */
export const fullSync = async (): Promise<{
  success: boolean;
  pushed: number;
  pulled: number;
  error?: string;
}> => {
  if (!isCloudSyncAvailable()) {
    return { success: false, pushed: 0, pulled: 0, error: 'Not authenticated' };
  }

  updateSyncState({ status: 'syncing' });

  try {
    // Pull first to get any new cloud data
    const pullResult = await pullFromCloud();
    if (!pullResult.success) {
      throw new Error(pullResult.error);
    }

    // Then push local changes
    const pushResult = await pushToCloud();
    if (!pushResult.success) {
      throw new Error(pushResult.error);
    }

    updateSyncState({
      status: 'synced',
      lastSyncAt: new Date(),
      pendingChanges: 0,
    });

    return {
      success: true,
      pushed: pushResult.count,
      pulled: pullResult.count,
    };
  } catch (error) {
    console.error('Full sync error:', error);
    updateSyncState({
      status: 'error',
      error: error instanceof Error ? error.message : 'Sync failed',
    });
    return {
      success: false,
      pushed: 0,
      pulled: 0,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
};

/**
 * Get sync statistics
 */
export const getSyncStats = async (): Promise<{
  localEntries: number;
  cloudEntries: number;
  pendingChanges: number;
  lastSyncAt: Date | null;
  syncStatus: string;
}> => {
  const localEntries = getEntries().length;
  const pendingChanges = getPendingChanges().length;
  
  let cloudEntries = 0;
  let lastSyncAt: Date | null = null;
  let syncStatus = 'local-only';

  if (isCloudSyncAvailable()) {
    try {
      const metadata = await cloudGetSyncMetadata();
      if (metadata) {
        lastSyncAt = metadata.lastSyncAt ? new Date(metadata.lastSyncAt) : null;
        syncStatus = metadata.syncStatus;
      }
      
      const entries = await cloudGetEntries(1);
      // This is approximate - we'd need a count endpoint for exact number
      cloudEntries = entries.length > 0 ? localEntries : 0;
    } catch {
      syncStatus = 'error';
    }
  }

  return {
    localEntries,
    cloudEntries,
    pendingChanges,
    lastSyncAt,
    syncStatus,
  };
};

/**
 * Initialize sync on app startup
 */
export const initializeSync = async () => {
  const pending = getPendingChanges();
  updateSyncState({ pendingChanges: pending.length });

  // If authenticated, try to sync pending changes
  if (isCloudSyncAvailable() && pending.length > 0) {
    await processPendingChanges();
  }
};

/**
 * Check if we're in local-only mode
 */
export const isLocalOnlyMode = (): boolean => {
  return !isSupabaseConfigured() || !isCloudSyncAvailable();
};
