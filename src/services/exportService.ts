/**
 * MAEPLE Data Export Service
 *
 * Enables users to export their data for backup, portability, and trust.
 * Part of MAEPLE's privacy-first commitment.
 */

import JSZip from "jszip";
import { HealthEntry, StateCheck, UserSettings, WearableDataPoint } from "../types";
import { getRecentStateChecks, saveStateCheck } from "./stateCheckService";
import { getEntries, getUserSettings } from "./storageService";
import { validateStateCheck } from "./validationService";

export interface ExportData {
  version: string;
  exportedAt: string;
  app: "MAEPLE";
  data: {
    entries: HealthEntry[];
    settings: UserSettings;
    stateChecks: StateCheck[];
    wearableData?: WearableDataPoint[];
  };
  metadata: {
    totalEntries: number;
    totalStateChecks: number;
    dateRange: {
      earliest: string | null;
      latest: string | null;
    };
  };
}

export interface ImportResult {
  success: boolean;
  imported: {
    entries: number;
    stateChecks: number;
    settings: boolean;
  };
  errors: string[];
}

/**
 * Export all user data to a JSON structure
 */
export const exportAllData = async (includeImages = false): Promise<ExportData> => {
  const entries = await getEntries();
  const settings = await getUserSettings();
  let stateChecks = await getRecentStateChecks(1000); // Get all available

  // Strip images if not requested to reduce size and prevent timeouts
  if (!includeImages) {
    stateChecks = stateChecks.map(check => {
      const { imageBase64, ...rest } = check;
      return rest as StateCheck;
    });
  }

  // Calculate date range
  let earliest: string | null = null;
  let latest: string | null = null;

  if (entries.length > 0) {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    earliest = sorted[0].timestamp;
    latest = sorted[sorted.length - 1].timestamp;
  }

  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    app: "MAEPLE",
    data: {
      entries,
      settings,
      stateChecks,
    },
    metadata: {
      totalEntries: entries.length,
      totalStateChecks: stateChecks.length,
      dateRange: { earliest, latest },
    },
  };
};

/**
 * Export data as a ZIP file (efficient for large datasets with images)
 */
export const exportToZip = async (): Promise<void> => {
  const zip = new JSZip();
  const entries = await getEntries();
  const settings = await getUserSettings();
  const stateChecks = await getRecentStateChecks(1000);

  // 1. Add JSON data (stripped of images)
  const stateChecksMetadata = stateChecks.map(check => {
    const { imageBase64, ...rest } = check;
    return {
      ...rest,
      imagePath: imageBase64 ? `images/${check.id}.jpg` : undefined,
    };
  });

  const exportData = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    app: "MAEPLE",
    data: {
      entries,
      settings,
      stateChecks: stateChecksMetadata,
    },
    metadata: {
      totalEntries: entries.length,
      totalStateChecks: stateChecks.length,
    },
  };

  zip.file("maeple_data.json", JSON.stringify(exportData, null, 2));

  // 2. Add Images folder
  const imgFolder = zip.folder("images");
  if (imgFolder) {
    stateChecks.forEach(check => {
      if (check.imageBase64) {
        // Remove data:image/jpeg;base64, prefix
        const base64Data = check.imageBase64.split(",")[1];
        if (base64Data) {
          imgFolder.file(`${check.id}.jpg`, base64Data, { base64: true });
        }
      }
    });
  }

  // 3. Generate and download
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);

  const date = new Date().toISOString().split("T")[0];
  const filename = `maeple-full-backup-${date}.zip`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Download exported data as a JSON file
 */
export const downloadExport = async (includeImages = false): Promise<void> => {
  if (includeImages) {
    return exportToZip();
  }

  const data = await exportAllData(false);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split("T")[0];
  const filename = `maeple-backup-${date}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Validate import data structure
 */
const validateImportData = (data: unknown): data is ExportData => {
  if (!data || typeof data !== "object") return false;

  const d = data as Record<string, unknown>;

  if (d.app !== "MAEPLE") return false;
  if (!d.version || typeof d.version !== "string") return false;
  if (!d.data || typeof d.data !== "object") return false;

  const dataObj = d.data as Record<string, unknown>;
  if (!Array.isArray(dataObj.entries)) return false;

  return true;
};

/**
 * Import data from a JSON backup file
 * Merges with existing data (doesn't overwrite)
 */
export const importData = async (
  jsonString: string,
  options: { mergeEntries?: boolean; overwriteSettings?: boolean; mergeStateChecks?: boolean } = {}
): Promise<ImportResult> => {
  const { mergeEntries = true, overwriteSettings = false, mergeStateChecks = true } = options;
  const errors: string[] = [];
  const result: ImportResult = {
    success: false,
    imported: { entries: 0, stateChecks: 0, settings: false },
    errors,
  };

  const dataUrlToBlob = (dataUrl: string): Blob | null => {
    const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
    if (!match) return null;
    const mime = match[1];
    const base64 = match[2];
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    } catch {
      return null;
    }
  };

  try {
    const parsed = JSON.parse(jsonString);

    if (!validateImportData(parsed)) {
      errors.push("Invalid MAEPLE backup file format");
      return result;
    }

    const importData = parsed as ExportData;

    // Import entries
    if (importData.data.entries && importData.data.entries.length > 0) {
      const existingEntries = await getEntries();
      const existingIds = new Set(existingEntries.map(e => e.id));

      let newEntries: HealthEntry[];

      if (mergeEntries) {
        // Only add entries that don't already exist
        const toImport = importData.data.entries.filter(e => !existingIds.has(e.id));
        newEntries = [...existingEntries, ...toImport];
        result.imported.entries = toImport.length;
      } else {
        newEntries = importData.data.entries;
        result.imported.entries = newEntries.length;
      }

      // Save to storage (using storage wrapper)
      const { bulkSaveEntries } = await import('./storageService');
      await bulkSaveEntries(newEntries);
    }

    // Import settings
    if (importData.data.settings && overwriteSettings) {
      const { saveUserSettings } = await import('./storageService');
      await saveUserSettings(importData.data.settings, true); // skipSync = true
      result.imported.settings = true;
    }

    // Import Bio-Mirror history (StateChecks) into IndexedDB
    if (importData.data.stateChecks && importData.data.stateChecks.length > 0) {
      let existingIds = new Set<string>();
      if (mergeStateChecks) {
        try {
          const existing = await getRecentStateChecks(10000);
          existingIds = new Set(existing.map(s => s.id));
        } catch (e) {
          errors.push(
            `Unable to read existing Bio-Mirror history for merge: ${e instanceof Error ? e.message : "Unknown error"}`
          );
        }
      }

      for (let i = 0; i < importData.data.stateChecks.length; i++) {
        const raw = importData.data.stateChecks[i];
        const validated = validateStateCheck(raw);
        if (!validated) {
          errors.push(`Skipped invalid Bio-Mirror record at index ${i}`);
          continue;
        }

        if (mergeStateChecks && existingIds.has(validated.id)) {
          continue;
        }

        const imageBlob = validated.imageBase64 ? dataUrlToBlob(validated.imageBase64) : null;

        try {
          await saveStateCheck(
            {
              id: validated.id,
              timestamp: validated.timestamp,
              analysis: validated.analysis,
              userNote: validated.userNote,
            },
            imageBlob || undefined
          );
          result.imported.stateChecks++;
        } catch (e) {
          errors.push(
            `Failed to import Bio-Mirror record ${validated.id}: ${e instanceof Error ? e.message : "Unknown error"}`
          );
        }
      }
    }

    result.success = true;
    return result;
  } catch (e) {
    errors.push(`Parse error: ${e instanceof Error ? e.message : "Unknown error"}`);
    return result;
  }
};

/**
 * Read a file and return its contents as a string
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

/**
 * Clear all local data (for account reset)
 */
export const clearAllData = async (): Promise<void> => {
  // Clear localStorage
  const keysToRemove = [
    "maeple_entries",
    "maeple_user_settings",
    "maeple_ai_settings",
    "maeple_key",
    "maeple_wearable_config",
  ];

  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Clear IndexedDB
  const databases = ["maeple_db", "maeple-offline"];

  for (const dbName of databases) {
    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error(`Failed to delete database ${dbName}:`, e);
    }
  }
};

/**
 * Get storage usage statistics
 */
export const getStorageStats = async (): Promise<{
  entries: number;
  stateChecks: number;
  estimatedSizeKB: number;
}> => {
  const entries = await getEntries();
  const stateChecks = await getRecentStateChecks(1000);

  // Estimate size
  const entriesJson = JSON.stringify(entries);
  const stateChecksJson = JSON.stringify(stateChecks);
  const estimatedSizeKB = Math.round((entriesJson.length + stateChecksJson.length) / 1024);

  return {
    entries: entries.length,
    stateChecks: stateChecks.length,
    estimatedSizeKB,
  };
};
