/**
 * MAEPLE Store Index
 *
 * Central export for all Zustand stores.
 */

// App store - main application state
export {
  useAppStore,
  selectCurrentView,
  selectEntries,
  selectWearableData,
  selectUserSettings,
  selectIsLoading,
  selectError,
  selectShowOnboarding,
  selectRecentEntries,
  selectEntryCount,
} from "./appStore";

// Auth store - authentication state
export {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectIsAuthLoading,
  selectAuthError,
} from "./authStore";

// Sync store - cloud sync state
export {
  useSyncStore,
  selectSyncStatus,
  selectLastSyncAt,
  selectPendingChanges,
  selectSyncError,
  selectSyncStats,
  selectIsSyncing,
} from "./syncStore";

// Re-export types
export type {
  HealthEntry,
  View,
  WearableDataPoint,
  UserSettings,
} from "../types";
