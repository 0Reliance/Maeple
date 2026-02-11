import { HealthEntry, UserSettings } from "../types";
import { storageWrapper } from "./storageWrapper";
import { validateHealthEntries } from "./validationService";

const STORAGE_KEY = "maeple_entries";
const SETTINGS_KEY = "maeple_user_settings";
const PENDING_KEY = "maeple_pending_sync";

/**
 * Write serialization queue — prevents concurrent read-modify-write races.
 * All entry mutations (save, delete, bulk) are funneled through this queue
 * so each operation sees the result of the previous one.
 */
let _writeQueue: Promise<unknown> = Promise.resolve();
const serializedWrite = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = _writeQueue.then(fn, fn); // run even if previous rejected
  _writeQueue = next.catch(() => {}); // swallow to keep chain alive
  return next;
};

// Simple pending change interface (avoid circular deps)
interface PendingChange {
  type: "entry" | "settings";
  action: "create" | "update" | "delete";
  id: string;
  timestamp: string;
}

// Local helper to queue changes (avoids importing syncService)
const queuePendingChange = async (
  type: "entry" | "settings",
  action: "create" | "update" | "delete",
  id: string
) => {
  try {
    const stored = await storageWrapper.getItem(PENDING_KEY);
    const pending: PendingChange[] = stored ? JSON.parse(stored) : [];
    const filtered = pending.filter(p => !(p.id === id && p.type === type));
    filtered.push({ type, action, id, timestamp: new Date().toISOString() });
    await storageWrapper.setItem(PENDING_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[StorageService] Failed to queue pending change:', error);
  }
};

export const getEntries = async (): Promise<HealthEntry[]> => {
  try {
    const stored = await storageWrapper.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Validate and sanitize entries to prevent corrupted data from crashing app
    const validated = validateHealthEntries(parsed);
    if (Array.isArray(parsed) && validated.length < parsed.length) {
      console.warn(`[StorageService] Filtered ${parsed.length - validated.length} invalid entries during read`);
    }
    return validated;
  } catch (error) {
    console.error('[StorageService] Failed to get entries:', error);
    return [];
  }
};

export const saveEntry = async (entry: HealthEntry, skipSync = false): Promise<HealthEntry[]> => {
  return serializedWrite(async () => {
    const entries = await getEntries();
    const existingIndex = entries.findIndex(e => e.id === entry.id);

    let updated: HealthEntry[];
    let action: "create" | "update";

    if (existingIndex >= 0) {
      // Update existing entry
      updated = [...entries];
      updated[existingIndex] = { ...entry, updatedAt: new Date().toISOString() };
      action = "update";
    } else {
      // Add new entry
      updated = [entry, ...entries];
      action = "create";
    }

    const success = await storageWrapper.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (!success) {
      throw new Error('Failed to save entry');
    }

    // Queue for cloud sync
    if (!skipSync) {
      await queuePendingChange("entry", action, entry.id);
    }

    return updated;
  });
};

export const deleteEntry = async (id: string, skipSync = false): Promise<HealthEntry[]> => {
  return serializedWrite(async () => {
    const entries = await getEntries();
    const updated = entries.filter(e => e.id !== id);
    
    const success = await storageWrapper.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (!success) {
      throw new Error('Failed to delete entry');
    }

    // Queue for cloud sync
    if (!skipSync) {
      await queuePendingChange("entry", "delete", id);
    }

    return updated;
  });
};

export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    const stored = await storageWrapper.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : { avgCycleLength: 28 };
  } catch (error) {
    console.error('[StorageService] Failed to get user settings:', error);
    return { avgCycleLength: 28 };
  }
};

export const saveUserSettings = async (settings: UserSettings, skipSync = false): Promise<UserSettings> => {
  try {
    const success = await storageWrapper.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (!success) {
      throw new Error('Failed to save settings');
    }

    // Queue for cloud sync
    if (!skipSync) {
      await queuePendingChange("settings", "update", "user_settings");
    }

    return settings;
  } catch (error) {
    console.error('[StorageService] Failed to save user settings:', error);
    throw error;
  }
};

/**
 * Bulk save entries (used by import/sync)
 * Does not queue for sync (used when pulling from cloud)
 */
export const bulkSaveEntries = async (entries: HealthEntry[]): Promise<HealthEntry[]> => {
  return serializedWrite(async () => {
    const success = await storageWrapper.setItem(STORAGE_KEY, JSON.stringify(entries));
    if (!success) {
      throw new Error('Failed to bulk save entries');
    }
    return entries;
  });
};

/**
 * Clear all local data
 */
export const clearLocalData = async (): Promise<void> => {
  try {
    await storageWrapper.removeItem(STORAGE_KEY);
    await storageWrapper.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error('[StorageService] Failed to clear local data:', error);
    throw error;
  }
};

/**
 * Get pending changes for sync
 */
export const getPendingChanges = async (): Promise<PendingChange[]> => {
  try {
    const stored = await storageWrapper.getItem(PENDING_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[StorageService] Failed to get pending changes:', error);
    return [];
  }
};

/**
 * Remove a pending change after sync
 */
export const removePendingChange = async (
  id: string,
  type: "entry" | "settings"
): Promise<void> => {
  try {
    const stored = await storageWrapper.getItem(PENDING_KEY);
    const pending: PendingChange[] = stored ? JSON.parse(stored) : [];
    const filtered = pending.filter(p => !(p.id === id && p.type === type));
    await storageWrapper.setItem(PENDING_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[StorageService] Failed to remove pending change:', error);
  }
};
