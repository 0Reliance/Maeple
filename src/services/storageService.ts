import { HealthEntry, UserSettings } from "../types";

const STORAGE_KEY = "maeple_entries";
const SETTINGS_KEY = "maeple_user_settings";
const PENDING_KEY = "maeple_pending_sync";

// Simple pending change interface (avoid circular deps)
interface PendingChange {
  type: "entry" | "settings";
  action: "create" | "update" | "delete";
  id: string;
  timestamp: string;
}

// Local helper to queue changes (avoids importing syncService)
const queuePendingChange = (
  type: "entry" | "settings",
  action: "create" | "update" | "delete",
  id: string
) => {
  const stored = localStorage.getItem(PENDING_KEY);
  const pending: PendingChange[] = stored ? JSON.parse(stored) : [];
  const filtered = pending.filter(p => !(p.id === id && p.type === type));
  filtered.push({ type, action, id, timestamp: new Date().toISOString() });
  localStorage.setItem(PENDING_KEY, JSON.stringify(filtered));
};

export const getEntries = (): HealthEntry[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveEntry = (entry: HealthEntry, skipSync = false) => {
  const entries = getEntries();
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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Queue for cloud sync
  if (!skipSync) {
    queuePendingChange("entry", action, entry.id);
  }

  return updated;
};

export const deleteEntry = (id: string, skipSync = false) => {
  const entries = getEntries();
  const updated = entries.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Queue for cloud sync
  if (!skipSync) {
    queuePendingChange("entry", "delete", id);
  }

  return updated;
};

export const getUserSettings = (): UserSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : { avgCycleLength: 28 };
};

export const saveUserSettings = (settings: UserSettings, skipSync = false) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

  // Queue for cloud sync
  if (!skipSync) {
    queuePendingChange("settings", "update", "user_settings");
  }

  return settings;
};

/**
 * Bulk save entries (used by import/sync)
 * Does not queue for sync (used when pulling from cloud)
 */
export const bulkSaveEntries = (entries: HealthEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entries;
};

/**
 * Clear all local data
 */
export const clearLocalData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
};
