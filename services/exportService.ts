/**
 * MAEPLE Data Export Service
 * 
 * Enables users to export their data for backup, portability, and trust.
 * Part of MAEPLE's privacy-first commitment.
 */

import { HealthEntry, UserSettings, WearableDataPoint, StateCheck } from '../types';
import { getEntries, getUserSettings } from './storageService';
import { getRecentStateChecks } from './stateCheckService';

export interface ExportData {
  version: string;
  exportedAt: string;
  app: 'MAEPLE';
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
export const exportAllData = async (): Promise<ExportData> => {
  const entries = getEntries();
  const settings = getUserSettings();
  const stateChecks = await getRecentStateChecks(1000); // Get all available
  
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
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    app: 'MAEPLE',
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
 * Download exported data as a JSON file
 */
export const downloadExport = async (): Promise<void> => {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `maeple-backup-${date}.json`;
  
  const a = document.createElement('a');
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
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Record<string, unknown>;
  
  if (d.app !== 'MAEPLE') return false;
  if (!d.version || typeof d.version !== 'string') return false;
  if (!d.data || typeof d.data !== 'object') return false;
  
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
  options: { mergeEntries?: boolean; overwriteSettings?: boolean } = {}
): Promise<ImportResult> => {
  const { mergeEntries = true, overwriteSettings = false } = options;
  const errors: string[] = [];
  const result: ImportResult = {
    success: false,
    imported: { entries: 0, stateChecks: 0, settings: false },
    errors,
  };
  
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!validateImportData(parsed)) {
      errors.push('Invalid MAEPLE backup file format');
      return result;
    }
    
    const importData = parsed as ExportData;
    
    // Import entries
    if (importData.data.entries && importData.data.entries.length > 0) {
      const existingEntries = getEntries();
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
      
      // Save to storage
      localStorage.setItem('maeple_entries', JSON.stringify(newEntries));
    }
    
    // Import settings
    if (importData.data.settings && overwriteSettings) {
      localStorage.setItem('maeple_user_settings', JSON.stringify(importData.data.settings));
      result.imported.settings = true;
    }
    
    // Note: StateCheck import would require IndexedDB operations
    // For now, we log a message about manual restoration
    if (importData.data.stateChecks && importData.data.stateChecks.length > 0) {
      errors.push(`Bio-Mirror history (${importData.data.stateChecks.length} checks) requires manual restoration. Contact support.`);
    }
    
    result.success = true;
    return result;
    
  } catch (e) {
    errors.push(`Parse error: ${e instanceof Error ? e.message : 'Unknown error'}`);
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
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Clear all local data (for account reset)
 */
export const clearAllData = async (): Promise<void> => {
  // Clear localStorage
  const keysToRemove = [
    'maeple_entries',
    'maeple_user_settings',
    'maeple_ai_settings',
    'maeple_key',
    'maeple_wearable_config',
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Clear IndexedDB
  const databases = ['maeple_db', 'maeple-offline'];
  
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
  const entries = getEntries();
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
