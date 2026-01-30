/**
 * MAEPLE App Store
 *
 * Central state management using Zustand.
 * Replaces prop drilling and scattered useState calls in App.tsx.
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { HealthEntry, View, WearableDataPoint, UserSettings } from "../types";
import {
  getEntries,
  saveEntry,
  deleteEntry,
  getUserSettings,
  saveUserSettings,
} from "../services/storageService";
import { initializeAI } from "../services/ai";
import { initializeSync, triggerPendingSync } from "../services/syncService";

// ============================================
// TYPES
// ============================================

interface AppState {
  // View state
  currentView: View;
  mobileMenuOpen: boolean;

  // Data state
  entries: HealthEntry[];
  wearableData: WearableDataPoint[];
  userSettings: UserSettings;

  // Status flags
  isInitialized: boolean;
  aiInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AppActions {
  // View actions
  setView: (view: View) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  closeMobileMenu: () => void;

  // Entry actions
  addEntry: (entry: HealthEntry) => void;
  updateEntry: (entry: HealthEntry) => void;
  removeEntry: (id: string) => void;
  loadEntries: () => void;

  // Wearable actions
  setWearableData: (data: WearableDataPoint[]) => void;
  addWearableData: (data: WearableDataPoint[]) => void;
  mergeWearableData: (data: WearableDataPoint[]) => void;
  clearWearableData: () => void;

  // Settings actions
  updateSettings: (settings: Partial<UserSettings>) => void;
  loadSettings: () => void;

  // Status actions
  setAiInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Initialization
  initialize: () => Promise<void>;
  initializeApp: () => Promise<void>;
  reset: () => void;
}

type AppStore = AppState & AppActions;

// ============================================
// INITIAL STATE
// ============================================

const initialState: AppState = {
  currentView: View.JOURNAL,
  mobileMenuOpen: false,
  entries: [],
  wearableData: [],
  userSettings: { avgCycleLength: 28 },
  isInitialized: false,
  aiInitialized: false,
  isLoading: false,
  error: null,
};

// ============================================
// STORE
// ============================================

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // View actions
        setView: (view) => {
          set({ currentView: view, mobileMenuOpen: false }, false, "setView");
        },

        toggleMobileMenu: () => {
          set(
            (state) => ({ mobileMenuOpen: !state.mobileMenuOpen }),
            false,
            "toggleMobileMenu"
          );
        },

        setMobileMenuOpen: (open) => {
          set({ mobileMenuOpen: open }, false, "setMobileMenuOpen");
        },

        closeMobileMenu: () => {
          set({ mobileMenuOpen: false }, false, "closeMobileMenu");
        },

        // Entry actions
        addEntry: (entry) => {
          const updated = saveEntry(entry);
          set({ entries: updated }, false, "addEntry");
        },

        updateEntry: (entry) => {
          const updated = saveEntry(entry);
          set({ entries: updated }, false, "updateEntry");
        },

        removeEntry: (id) => {
          const updated = deleteEntry(id);
          set({ entries: updated }, false, "removeEntry");
        },

        loadEntries: () => {
          const entries = getEntries();
          set({ entries }, false, "loadEntries");
        },

        // Wearable actions
        setWearableData: (data) => {
          set({ wearableData: data }, false, "setWearableData");
        },

        addWearableData: (data) => {
          set(
            (state) => {
              // Dedupe by ID
              const existingIds = new Set(state.wearableData.map((d) => d.id));
              const newData = data.filter((d) => !existingIds.has(d.id));
              return { wearableData: [...state.wearableData, ...newData] };
            },
            false,
            "addWearableData"
          );
        },

        mergeWearableData: (data) => {
          set(
            (state) => {
              // Dedupe by ID - same as addWearableData but with clearer name
              const existingIds = new Set(state.wearableData.map((d) => d.id));
              const newData = data.filter((d) => !existingIds.has(d.id));
              return { wearableData: [...state.wearableData, ...newData] };
            },
            false,
            "mergeWearableData"
          );
        },

        clearWearableData: () => {
          set({ wearableData: [] }, false, "clearWearableData");
        },

        // Settings actions
        updateSettings: (settings) => {
          const current = get().userSettings;
          const updated = { ...current, ...settings };
          saveUserSettings(updated);

          // Apply theme
          if (settings.theme) {
            const root = window.document.documentElement;
            root.classList.remove("light", "dark");

            if (settings.theme === "system") {
              const systemTheme = window.matchMedia(
                "(prefers-color-scheme: dark)"
              ).matches
                ? "dark"
                : "light";
              root.classList.add(systemTheme);
            } else {
              root.classList.add(settings.theme);
            }
          }

          set({ userSettings: updated }, false, "updateSettings");
        },

        loadSettings: () => {
          const settings = getUserSettings();
          set({ userSettings: settings }, false, "loadSettings");
        },

        // Status actions
        setAiInitialized: (initialized) => {
          set({ aiInitialized: initialized }, false, "setAiInitialized");
        },

        setLoading: (loading) => {
          set({ isLoading: loading }, false, "setLoading");
        },

        setError: (error) => {
          set({ error }, false, "setError");
        },

        // Initialization
        initialize: async () => {
          if (get().isInitialized) return;

          set({ isLoading: true }, false, "initialize:start");

          try {
            // Load data from storage
            const entries = getEntries();
            const settings = getUserSettings();

            // Apply theme
            if (settings.theme) {
              const root = window.document.documentElement;
              root.classList.remove("light", "dark");

              if (settings.theme === "system") {
                const systemTheme = window.matchMedia(
                  "(prefers-color-scheme: dark)"
                ).matches
                  ? "dark"
                  : "light";
                root.classList.add(systemTheme);
              } else {
                root.classList.add(settings.theme);
              }
            }

            set(
              {
                entries,
                userSettings: settings,
                isInitialized: true,
                isLoading: false,
              },
              false,
              "initialize:complete"
            );
          } catch (error) {
            console.error("Failed to initialize app store:", error);
            set(
              {
                error:
                  error instanceof Error
                    ? error.message
                    : "Initialization failed",
                isLoading: false,
              },
              false,
              "initialize:error"
            );
          }
        },

        // Full app initialization including AI and sync
        initializeApp: async () => {
          // First do basic initialization
          await get().initialize();

          // Initialize AI services
          try {
            await initializeAI();
            set({ aiInitialized: true }, false, "initializeApp:ai");
          } catch (error) {
            console.warn("AI initialization failed (non-critical):", error);
            set({ aiInitialized: true }, false, "initializeApp:ai:fallback");
          }

          // Initialize sync services
          try {
            initializeSync();
            triggerPendingSync();
          } catch (error) {
            console.warn("Sync initialization failed (non-critical):", error);
          }
        },

        reset: () => {
          set(initialState, false, "reset");
        },
      }),
      {
        name: "maeple-app-store",
        // Only persist UI preferences, not data (data is in localStorage separately)
        partialize: (state) => ({
          currentView: state.currentView,
        }),
      }
    ),
    { name: "AppStore" }
  )
);

// ============================================
// SELECTORS (for performance optimization)
// ============================================

export const selectCurrentView = (state: AppStore) => state.currentView;
export const selectEntries = (state: AppStore) => state.entries;
export const selectWearableData = (state: AppStore) => state.wearableData;
export const selectUserSettings = (state: AppStore) => state.userSettings;
export const selectIsLoading = (state: AppStore) => state.isLoading;
export const selectError = (state: AppStore) => state.error;

// Derived selectors
export const selectRecentEntries = (limit: number) => (state: AppStore) =>
  state.entries.slice(0, limit);

export const selectEntryCount = (state: AppStore) => state.entries.length;
