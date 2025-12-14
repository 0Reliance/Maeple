/**
 * MAEPLE Sync Store
 *
 * Manages cloud sync state and operations.
 * Provides reactive sync status across the app.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  getSyncState,
  onSyncStateChange,
  pushToCloud,
  pullFromCloud,
  fullSync,
  getSyncStats,
  initializeSync,
  SyncState,
} from "../services/syncService";

// ============================================
// TYPES
// ============================================

interface SyncStats {
  localEntries: number;
  cloudEntries: number;
  pendingChanges: number;
  lastSyncAt: Date | null;
  syncStatus: string;
}

interface SyncStoreState {
  status: SyncState["status"];
  lastSyncAt: Date | null;
  pendingChanges: number;
  error: string | null;
  isInitialized: boolean;
  stats: SyncStats | null;
}

interface SyncStoreActions {
  // Sync actions
  push: () => Promise<{ success: boolean; count: number; error?: string }>;
  pull: () => Promise<{ success: boolean; count: number; error?: string }>;
  syncAll: () => Promise<{
    success: boolean;
    pushed: number;
    pulled: number;
    error?: string;
  }>;
  refreshStats: () => Promise<void>;

  // State management
  setStatus: (status: SyncState["status"]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Initialization
  initialize: () => Promise<void>;
}

type SyncStore = SyncStoreState & SyncStoreActions;

// ============================================
// INITIAL STATE
// ============================================

const initialState: SyncStoreState = {
  status: "idle",
  lastSyncAt: null,
  pendingChanges: 0,
  error: null,
  isInitialized: false,
  stats: null,
};

// ============================================
// STORE
// ============================================

export const useSyncStore = create<SyncStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Sync actions
      push: async () => {
        set({ status: "syncing", error: null }, false, "push:start");

        const result = await pushToCloud();

        if (result.success) {
          set(
            {
              status: "synced",
              lastSyncAt: new Date(),
              pendingChanges: 0,
              error: null,
            },
            false,
            "push:success"
          );
        } else {
          set(
            {
              status: "error",
              error: result.error || "Push failed",
            },
            false,
            "push:error"
          );
        }

        return result;
      },

      pull: async () => {
        set({ status: "syncing", error: null }, false, "pull:start");

        const result = await pullFromCloud();

        if (result.success) {
          set(
            {
              status: "synced",
              lastSyncAt: new Date(),
              error: null,
            },
            false,
            "pull:success"
          );
        } else {
          set(
            {
              status: "error",
              error: result.error || "Pull failed",
            },
            false,
            "pull:error"
          );
        }

        return result;
      },

      syncAll: async () => {
        set({ status: "syncing", error: null }, false, "syncAll:start");

        const result = await fullSync();

        if (result.success) {
          set(
            {
              status: "synced",
              lastSyncAt: new Date(),
              pendingChanges: 0,
              error: null,
            },
            false,
            "syncAll:success"
          );
        } else {
          set(
            {
              status: "error",
              error: result.error || "Sync failed",
            },
            false,
            "syncAll:error"
          );
        }

        return result;
      },

      refreshStats: async () => {
        try {
          const stats = await getSyncStats();
          set({ stats }, false, "refreshStats");
        } catch (error) {
          console.error("Failed to refresh sync stats:", error);
        }
      },

      // State management
      setStatus: (status) => {
        set({ status }, false, "setStatus");
      },

      setError: (error) => {
        set({ error, status: error ? "error" : "idle" }, false, "setError");
      },

      clearError: () => {
        set({ error: null, status: "idle" }, false, "clearError");
      },

      // Initialization
      initialize: async () => {
        if (get().isInitialized) return;

        try {
          await initializeSync();

          // Get initial state
          const syncState = getSyncState();

          set(
            {
              status: syncState.status,
              lastSyncAt: syncState.lastSyncAt,
              pendingChanges: syncState.pendingChanges,
              isInitialized: true,
            },
            false,
            "initialize:complete"
          );

          // Subscribe to sync state changes
          onSyncStateChange((state: SyncState) => {
            set(
              {
                status: state.status,
                lastSyncAt: state.lastSyncAt,
                pendingChanges: state.pendingChanges,
                error: state.error || null,
              },
              false,
              "syncStateChange"
            );
          });

          // Load initial stats
          get().refreshStats();
        } catch (error) {
          console.error("Sync initialization failed:", error);
          set(
            {
              isInitialized: true,
              status: "error",
              error:
                error instanceof Error
                  ? error.message
                  : "Sync initialization failed",
            },
            false,
            "initialize:error"
          );
        }
      },
    }),
    { name: "SyncStore" }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectSyncStatus = (state: SyncStore) => state.status;
export const selectLastSyncAt = (state: SyncStore) => state.lastSyncAt;
export const selectPendingChanges = (state: SyncStore) => state.pendingChanges;
export const selectSyncError = (state: SyncStore) => state.error;
export const selectSyncStats = (state: SyncStore) => state.stats;
export const selectIsSyncing = (state: SyncStore) => state.status === "syncing";
