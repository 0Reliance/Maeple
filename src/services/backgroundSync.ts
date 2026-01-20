import { App } from "@capacitor/app";
import { wearableManager } from "./wearables/manager";
import { useAppStore } from "../stores/appStore";

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const MIN_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes throttle

let lastSyncTime = 0;
let syncInterval: any = null;

/**
 * Perform the sync operation
 */
const performSync = async (source: "background" | "foreground" | "timer") => {
  const now = Date.now();
  if (now - lastSyncTime < MIN_SYNC_INTERVAL_MS) {
    console.log(`[BackgroundSync] Skipping sync (${source}) - too soon`);
    return;
  }

  console.log(`[BackgroundSync] Starting sync (${source})...`);
  try {
    // Sync last 2 days to ensure we catch up on recent data
    const points = await wearableManager.syncAllProviders(2);

    if (points.length > 0) {
      console.log(`[BackgroundSync] Synced ${points.length} data points`);

      // Merge synced wearable data into the app store
      // Using getState() to access store outside of React components
      const { mergeWearableData } = useAppStore.getState();
      mergeWearableData(points);
    }

    lastSyncTime = Date.now();
  } catch (error) {
    console.error("[BackgroundSync] Sync failed:", error);
  }
};

/**
 * Initialize background sync service
 */
export const initBackgroundSync = () => {
  console.log("[BackgroundSync] Initializing...");

  // 1. Listen for App State changes (Resume from background)
  App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) {
      console.log("[BackgroundSync] App resumed");
      performSync("background");
    }
  });

  // 2. Set up periodic timer for when app is running
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    performSync("timer");
  }, SYNC_INTERVAL_MS);

  // 3. Perform initial sync
  performSync("foreground");
};

/**
 * Force a sync manually
 */
export const forceSync = () => {
  return performSync("foreground");
};
