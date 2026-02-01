# Maeple Code Review - Detailed Remediation Plan Phases 2-4

**Date:** February 1, 2026  
**Status:** Phase 1 Complete, Phases 2-4 Planned  
**Document Version:** 1.0

---

## Executive Summary

Phase 1 (Critical Stability) has been successfully completed. This document provides detailed implementation plans for remaining phases 2-4, with specific code locations, implementation details, and estimated effort.

---

## Phase 1.3: Background Sync Cleanup (HIGH PRIORITY)

### Issues Identified

1. **No Timeout Handling** (CRITICAL)
   - File: `src/services/syncService.ts`
   - Lines: `processPendingChanges()`, `pushToCloud()`, `pullFromCloud()`
   - Impact: Long-running sync operations can block indefinitely
   - Risk: Memory leaks from stale sync operations

2. **No Cleanup of Completed Operations** (HIGH)
   - File: `src/services/syncService.ts`
   - Lines: Throughout file
   - Impact: Pending changes accumulate over time
   - Risk: localStorage bloat, memory leaks

3. **No Queue Size Limits** (MEDIUM)
   - File: `src/services/syncService.ts`
   - Lines: `PENDING_KEY` storage
   - Impact: Unbounded queue growth
   - Risk: localStorage quota exceeded

### Implementation Plan

#### Step 1.3.1: Add Sync Timeout Mechanism
**File:** `src/services/syncService.ts`

```typescript
// Add at top of file
const SYNC_TIMEOUT_MS = 60000; // 60 second timeout
const MAX_SYNC_ATTEMPTS = 3;

// Track active sync operations
const activeSyncs = new Set<string>();

// Helper to create timeout promise
const createTimeout = (ms: number, message: string) => 
  new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(`Sync timeout: ${message}`)), ms)
  );

// Modified processPendingChanges with timeout
export const processPendingChanges = async (): Promise<void> => {
  if (!isCloudSyncAvailable()) {
    updateSyncState({ status: "offline" });
    return;
  }

  const pending = getPendingChanges();
  if (pending.length === 0) {
    updateSyncState({ status: "synced", pendingChanges: 0 });
    return;
  }

  updateSyncState({ status: "syncing" });
  const syncId = Date.now().toString();
  activeSyncs.add(syncId);

  try {
    // Add timeout protection
    await Promise.race([
      executeSyncOperations(pending),
      createTimeout(SYNC_TIMEOUT_MS, `Sync operations exceeded ${SYNC_TIMEOUT_MS}ms`)
    ]);

    updateSyncState({
      status: "synced",
      lastSyncAt: new Date(),
      pendingChanges: 0,
    });
  } catch (error) {
    console.error("Sync error:", error);
    updateSyncState({
      status: "error",
      error: error instanceof Error ? error.message : "Sync failed",
    });
  } finally {
    activeSyncs.delete(syncId);
  }
};

// Extract operations to separate function
async function executeSyncOperations(pending: PendingChange[]): Promise<void> {
  for (const change of pending) {
    if (!activeSyncs.has(change.id)) {
      continue; // Skip if sync was cancelled
    }
    
    // Existing sync logic here...
    if (change.type === "entry") {
      // ... existing code
    } else if (change.type === "settings") {
      // ... existing code
    }

    removePendingChange(change.id, change.type);
  }
}
```

**Effort:** 1-2 hours

#### Step 1.3.2: Add Queue Size Limits
**File:** `src/services/syncService.ts`

```typescript
// Add at top of file
const MAX_PENDING_CHANGES = 100;

// Modify addPendingChange (needs to be created)
export const addPendingChange = (change: PendingChange): void => {
  const pending = getPendingChanges();
  
  // Enforce queue limit
  if (pending.length >= MAX_PENDING_CHANGES) {
    // Remove oldest entries
    const toRemove = pending.slice(0, pending.length - MAX_PENDING_CHANGES + 1);
    toRemove.forEach(change => removePendingChange(change.id, change.type));
    console.warn(`[SyncService] Queue full, removed ${toRemove.length} oldest entries`);
  }
  
  pending.push(change);
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  updateSyncState({ pendingChanges: pending.length });
};
```

**Effort:** 1 hour

#### Step 1.3.3: Add Cleanup on App Start
**File:** `src/services/syncService.ts`

```typescript
// Modify initializeSync function
export const initializeSync = async () => {
  const pending = getPendingChanges();
  
  // Clean up stale pending changes (older than 7 days)
  const staleThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const freshPending = pending.filter(p => 
    new Date(p.timestamp).getTime() > staleThreshold
  );
  
  if (freshPending.length < pending.length) {
    const removed = pending.length - freshPending.length;
    console.warn(`[SyncService] Removed ${removed} stale pending changes`);
    localStorage.setItem(PENDING_KEY, JSON.stringify(freshPending));
  }
  
  updateSyncState({ pendingChanges: freshPending.length });

  // If authenticated, try to sync pending changes
  if (isCloudSyncAvailable() && freshPending.length > 0) {
    await processPendingChanges();
  }
};
```

**Effort:** 0.5 hours

#### Step 1.3.4: Add Tests
**File:** `tests/services/syncService.test.ts`

```typescript
describe('Sync Timeout Handling', () => {
  it('should timeout after SYNC_TIMEOUT_MS', async () => {
    // Mock slow sync operation
    // Expect timeout error
  });

  it('should not block on long-running syncs', async () => {
    // Verify UI remains responsive
  });
});

describe('Queue Size Limits', () => {
  it('should enforce MAX_PENDING_CHANGES limit', () => {
    // Add more than limit
    // Verify oldest are removed
  });

  it('should warn when queue is full', () => {
    // Verify console warning
  });
});

describe('Stale Cleanup', () => {
  it('should remove entries older than 7 days', async () => {
    // Add old entries
    // Run initializeSync
    // Verify removal
  });
});
```

**Effort:** 1-2 hours

### Total Phase 1.3 Effort: 3.5-5.5 hours

---

## Phase 2: Test Suite Improvements (HIGH PRIORITY)

### Issues Identified

1. **Test Timeout Failures** (HIGH)
   - File: `tests/` (multiple files)
   - Current timeout: 5s default (Vitest)
   - Issue: Some tests require > 5s (e.g., IndexedDB operations)
   - Affected tests from output:
     - `stateCheckService.test.ts` - 4 tests timed out at 5s
     - `imageProcessor.worker.test.ts` - 2 tests timed out at 5s

2. **React Act Warnings** (MEDIUM)
   - File: `tests/camera-image/useCameraCapture.test.ts`
   - Issue: State updates not wrapped in `act()`
   - Impact: Flaky tests, false positives

3. **Missing E2E Tests** (MEDIUM)
   - File: `tests/e2e/` (empty)
   - Issue: No critical flow testing
   - Impact: Integration issues not caught

### Implementation Plan

#### Step 2.1: Increase Test Timeout
**File:** `vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [react() as any],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@stores': path.resolve(__dirname, './src/stores'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    testTimeout: 10000, // ADD: Increase default timeout to 10s
    hookTimeout: 10000,  // ADD: Increase hook timeout to 10s
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/services/ai/**', 'src/services/wearables/**', 'tests/**'],
    },
  },
});
```

**Individual test timeout fixes (for specific slow tests):**

**File:** `tests/facs-core/stateCheckService.test.ts`

```typescript
describe('StateCheckService', () => {
  // Add timeout to slow tests
  it('should handle quota exceeded error', async () => {
    // Existing test code
  }, { timeout: 10000 }); // ADD: 10s timeout

  it('should create database with version 2', async () => {
    // Existing test code
  }, { timeout: 10000 }); // ADD: 10s timeout

  it('should create object stores on upgrade needed', async () => {
    // Existing test code
  }, { timeout: 10000 }); // ADD: 10s timeout

  it('should handle baseline store operations', async () => {
    // Existing test code
  }, { timeout: 10000 }); // ADD: 10s timeout
});
```

**File:** `tests/camera-image/imageProcessor.worker.test.ts`

```typescript
describe('ImageProcessor Worker', () => {
  it('should handle missing fields in message', async () => {
    // Existing test code
  }, { timeout: 10000 }); // ADD: 10s timeout

  it('should handle invalid image data', async () => {
    // Existing test code
  }, { timeout: 10000 }); // ADD: 10s timeout
});
```

**Effort:** 1 hour

#### Step 2.2: Fix React Act Warnings
**File:** `tests/camera-image/useCameraCapture.test.ts`

The issue is that state updates in the hook are not wrapped in `act()`. Need to update test setup:

```typescript
import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';

// In existing tests, wrap state changes:

// BEFORE (causes warnings):
it('should initialize camera when isActive becomes true', async () => {
  const { result } = renderHook(() => useCameraCapture({ isActive: false }));
  
  result.current.setIsActive(true); // State update not wrapped
  await waitFor(() => expect(cameraInitialized).toBe(true));
});

// AFTER (no warnings):
it('should initialize camera when isActive becomes true', async () => {
  const { result } = renderHook(() => useCameraCapture({ isActive: false }));
  
  await act(async () => {
    result.current.setIsActive(true);
  });
  
  await waitFor(() => expect(cameraInitialized).toBe(true));
});
```

**Specific test updates:**

1. **"should return videoRef, canvasRef, and state"**
```typescript
it('should return videoRef, canvasRef, and state', async () => {
  const { result } = renderHook(() => useCameraCapture({ isActive: true }));
  
  await act(async () => {
    // Wait for camera initialization
    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
  
  expect(result.current.videoRef.current).toBeInstanceOf(HTMLVideoElement);
  expect(result.current.canvasRef.current).toBeInstanceOf(HTMLCanvasElement);
});
```

2. **"should handle rapid toggle of isActive"**
```typescript
it('should handle rapid toggle of isActive', async () => {
  const { result } = renderHook(() => useCameraCapture({ isActive: true }));
  
  await waitFor(() => expect(result.current.cameraReady).toBe(true));
  
  await act(async () => {
    result.current.setIsActive(false);
    result.current.setIsActive(true);
  });
  
  await waitFor(() => expect(result.current.cameraReady).toBe(true));
});
```

**Effort:** 2 hours

#### Step 2.3: Add E2E Tests
**File:** `tests/e2e/journal-entry-flow.test.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Journal Entry Creation Flow', () => {
  test('should create and save journal entry', async ({ page }) => {
    await page.goto('/');
    
    // Fill journal entry
    await page.fill('[data-testid="journal-textarea"]', 'Feeling good today, high energy!');
    
    // Set energy levels
    await page.fill('[data-testid="energy-focus"]', '8');
    await page.fill('[data-testid="energy-emotional"]', '9');
    
    // Save entry
    await page.click('[data-testid="save-entry"]');
    
    // Verify success
    await expect(page.locator('[data-testid="entry-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="entry-card"]')).toContainText('Feeling good today');
  });
  
  test('should handle voice input', async ({ page }) => {
    await page.goto('/live-coach');
    
    // Start recording
    await page.click('[data-testid="record-button"]');
    await page.waitForTimeout(3000);
    
    // Stop recording
    await page.click('[data-testid="record-button"]');
    
    // Wait for processing
    await expect(page.locator('[data-testid="processing"]')).toBeVisible();
    await expect(page.locator('[data-testid="processing"]')).not.toBeVisible();
    
    // Verify entry created
    await expect(page.locator('[data-testid="entry-card"]')).toHaveCount(1);
  });
});
```

**File:** `tests/e2e/bio-mirror-flow.test.ts` (NEW)

```typescript
test.describe('Bio-Mirror State Check Flow', () => {
  test('should complete state check with camera', async ({ page }) => {
    await page.goto('/state-check');
    
    // Start camera
    await page.click('[data-testid="start-check"]');
    
    // Wait for camera initialization
    await expect(page.locator('[data-testid="camera-view"]')).toBeVisible();
    
    // Take photo
    await page.click('[data-testid="capture-button"]');
    
    // Wait for analysis
    await expect(page.locator('[data-testid="analyzing"]')).toBeVisible();
    await expect(page.locator('[data-testid="analyzing"]')).not.toBeVisible();
    
    // Verify results displayed
    await expect(page.locator('[data-testid="results"]')).toBeVisible();
  });
});
```

**File:** `tests/e2e/data-export-import-flow.test.ts` (NEW)

```typescript
test.describe('Data Export/Import Flow', () => {
  test('should export and import data', async ({ page, context }) => {
    // Create some data
    await page.goto('/');
    await page.fill('[data-testid="journal-textarea"]', 'Test entry');
    await page.click('[data-testid="save-entry"]');
    
    // Go to settings and export
    await page.goto('/settings');
    
    // Handle download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-json"]');
    const download = await downloadPromise;
    
    // Clear data
    await page.click('[data-testid="delete-all"]');
    await page.click('[data-testid="confirm-delete"]');
    
    // Import data
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="import-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(download.path());
    
    // Verify data restored
    await expect(page.locator('[data-testid="entry-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="entry-card"]')).toContainText('Test entry');
  });
});
```

**Effort:** 4-5 hours

### Total Phase 2 Effort: 7-8 hours

---

## Phase 3: Performance Optimization (MEDIUM PRIORITY)

### Issues Identified

1. **Simple Cache Key Generation** (MEDIUM)
   - File: `src/services/cacheService.ts`
   - Current: Simple string concatenation
   - Issue: Potential collisions, no versioning
   - Example: `cache.get("entry:" + id)`

2. **No Batch Sync Processing** (MEDIUM)
   - File: `src/services/syncService.ts`
   - Current: Individual API calls per entry
   - Issue: Multiple small requests instead of batched
   - Impact: Network overhead, API rate limits

3. **No Code Splitting** (MEDIUM)
   - File: `src/App.tsx`, `vite.config.ts`
   - Current: All code loaded at once
   - Issue: Large initial bundle
   - Impact: Slow initial load

### Implementation Plan

#### Step 3.1: Improve Cache Key Generation
**File:** `src/services/cacheKeyUtils.ts` (NEW)

```typescript
import { createHash } from 'crypto';

export interface CacheKeyOptions {
  version?: string;
  namespace?: string;
  prefix?: string;
}

/**
 * Generate collision-resistant cache key with hashing
 */
export function generateCacheKey(
  baseKey: string,
  options: CacheKeyOptions = {}
): string {
  const { version = 'v1', namespace = 'maeple', prefix } = options;
  
  // Build key parts
  const parts: string[] = [];
  
  if (prefix) parts.push(prefix);
  if (namespace) parts.push(namespace);
  parts.push(version);
  parts.push(baseKey);
  
  // Create hash for collision resistance
  const hash = createHash('sha256')
    .update(parts.join(':'))
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for brevity
  
  // Combine with readable prefix for debugging
  return `${parts.join(':')}:${hash}`;
}

/**
 * Generate cache key for entries
 */
export function generateEntryCacheKey(entryId: string): string {
  return generateCacheKey(entryId, {
    prefix: 'entry',
    version: 'v2',
  });
}

/**
 * Generate cache key for analysis results
 */
export function generateAnalysisCacheKey(
  imageHash: string,
  model: string
): string {
  return generateCacheKey(imageHash, {
    prefix: 'analysis',
    namespace: model,
    version: 'v1',
  });
}

/**
 * Parse cache key for debugging
 */
export function parseCacheKey(key: string): {
  namespace?: string;
  version?: string;
  hash: string;
} {
  const [prefix, ...rest] = key.split(':');
  const lastPart = rest[rest.length - 1];
  const hash = lastPart;
  const version = rest[rest.length - 2];
  const namespace = rest[rest.length - 3];
  
  return { namespace, version, hash };
}
```

**Update cacheService.ts to use new key generator:**

```typescript
import { generateCacheKey } from './cacheKeyUtils';

// Update get method
async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
  const cacheKey = generateCacheKey(key, {
    prefix: options.prefix,
  });
  
  const memoryEntry = this.memoryCache.get(cacheKey);
  if (memoryEntry && !this.isExpired(memoryEntry)) {
    logInfo(`[CacheService] L1 hit: ${cacheKey}`);
    return memoryEntry.data as T;
  }
  
  // ... rest of method
}

// Update set method
async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
  const cacheKey = generateCacheKey(key, {
    prefix: options.prefix,
  });
  
  const entry: CacheEntry<T> = {
    data: value,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  };
  
  this.setMemoryCache(cacheKey, entry);
  // ... rest of method
}
```

**Effort:** 2-3 hours

#### Step 3.2: Implement Batch Sync Processing
**File:** `src/services/syncService.ts`

Add batch processing methods:

```typescript
// Add batch configuration
const BATCH_SIZE = 50; // Process 50 entries at a time
const BATCH_DELAY_MS = 1000; // 1 second between batches

/**
 * Process pending changes in batches
 */
export async function processPendingChangesBatches(): Promise<void> {
  if (!isCloudSyncAvailable()) {
    updateSyncState({ status: "offline" });
    return;
  }

  const pending = getPendingChanges();
  if (pending.length === 0) {
    updateSyncState({ status: "synced", pendingChanges: 0 });
    return;
  }

  updateSyncState({ status: "syncing" });

  try {
    // Group by type
    const entriesToProcess = pending.filter(p => p.type === "entry");
    const settingsToProcess = pending.filter(p => p.type === "settings");

    // Process entries in batches
    for (let i = 0; i < entriesToProcess.length; i += BATCH_SIZE) {
      const batch = entriesToProcess.slice(i, i + BATCH_SIZE);
      await processEntryBatch(batch);
      
      // Add delay between batches
      if (i + BATCH_SIZE < entriesToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Process settings (usually just one)
    if (settingsToProcess.length > 0) {
      await processSettingsBatch(settingsToProcess);
    }

    updateSyncState({
      status: "synced",
      lastSyncAt: new Date(),
      pendingChanges: 0,
    });
  } catch (error) {
    console.error("Batch sync error:", error);
    updateSyncState({
      status: "error",
      error: error instanceof Error ? error.message : "Sync failed",
    });
  }
}

/**
 * Process a batch of entries
 */
async function processEntryBatch(changes: PendingChange[]): Promise<void> {
  // Separate creates, updates, deletes
  const creates = changes.filter(c => c.action === "create");
  const updates = changes.filter(c => c.action === "update");
  const deletes = changes.filter(c => c.action === "delete");

  // Process each action type
  if (creates.length > 0) {
    const entries = await getEntries();
    const entriesToCreate = entries.filter(e =>
      creates.some(c => c.id === e.id)
    );
    
    // Use batch create endpoint if available
    if (typeof apiClient.createEntries === 'function') {
      await apiClient.createEntries(entriesToCreate);
    } else {
      // Fallback to individual creates
      for (const entry of entriesToCreate) {
        await apiClient.createEntry(entry);
      }
    }
    
    creates.forEach(c => removePendingChange(c.id, c.type));
  }

  if (updates.length > 0) {
    const entries = await getEntries();
    const entriesToUpdate = entries.filter(e =>
      updates.some(c => c.id === e.id)
    );
    
    // Use batch update endpoint if available
    if (typeof apiClient.updateEntries === 'function') {
      await apiClient.updateEntries(entriesToUpdate);
    } else {
      // Fallback to individual updates
      for (const entry of entriesToUpdate) {
        await apiClient.updateEntry(entry.id, entry);
      }
    }
    
    updates.forEach(c => removePendingChange(c.id, c.type));
  }

  if (deletes.length > 0) {
    // Use batch delete endpoint if available
    if (typeof apiClient.deleteEntries === 'function') {
      await apiClient.deleteEntries(deletes.map(d => d.id));
    } else {
      // Fallback to individual deletes
      for (const change of deletes) {
        await apiClient.deleteEntry(change.id);
      }
    }
    
    deletes.forEach(c => removePendingChange(c.id, c.type));
  }
}

/**
 * Process a batch of settings changes
 */
async function processSettingsBatch(changes: PendingChange[]): Promise<void> {
  // Usually just one settings change
  if (changes.length > 0) {
    const settings = await getUserSettings();
    await apiClient.updateSettings(settings);
    changes.forEach(c => removePendingChange(c.id, c.type));
  }
}
```

**Add batch API methods to apiClient.ts:**

```typescript
/**
 * Create multiple entries in batch
 */
export async function createEntries(
  entries: Entry[]
): Promise<{ entries?: Entry[]; error?: string }> {
  const { data, error } = await apiRequest<{ entries: Entry[] }>('/entries/batch', {
    method: 'POST',
    body: JSON.stringify({ entries }),
  });

  if (error) {
    return { error };
  }

  return { entries: data?.entries };
}

/**
 * Update multiple entries in batch
 */
export async function updateEntries(
  entries: Entry[]
): Promise<{ entries?: Entry[]; error?: string }> {
  const { data, error } = await apiRequest<{ entries: Entry[] }>('/entries/batch', {
    method: 'PUT',
    body: JSON.stringify({ entries }),
  });

  if (error) {
    return { error };
  }

  return { entries: data?.entries };
}

/**
 * Delete multiple entries in batch
 */
export async function deleteEntries(
  ids: string[]
): Promise<{ success?: boolean; error?: string }> {
  const { data, error } = await apiRequest<{ success: boolean }>('/entries/batch', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });

  if (error) {
    return { error };
  }

  return { success: data?.success };
}
```

**Effort:** 3-4 hours

#### Step 3.3: Implement Code Splitting
**File:** `src/App.tsx`

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const StateCheckWizard = lazy(() => import('./components/StateCheckWizard'));
const LiveCoach = lazy(() => import('./components/LiveCoach'));
const VisionBoard = lazy(() => import('./components/VisionBoard'));
const Settings = lazy(() => import('./components/Settings'));
const HealthMetricsDashboard = lazy(() => import('./components/HealthMetricsDashboard'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));

// Add loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Route-based lazy loading */}
        <Route path="/state-check" element={<StateCheckWizard />} />
        <Route path="/live-coach" element={<LiveCoach />} />
        <Route path="/vision-board" element={<VisionBoard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/metrics" element={<HealthMetricsDashboard />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
      </Routes>
    </Suspense>
  );
}
```

**File:** `vite.config.ts`

```typescript
export default defineConfig({
  // ... existing config
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Create vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('@mui') || id.includes('@mui')) return 'ui-vendor';
            if (id.includes('d3')) return 'charts-vendor';
            if (id.includes('ai') || id.includes('gemini')) return 'ai-vendor';
            return 'vendor';
          }
          
          // Create feature chunks
          if (id.includes('/state-check')) return 'state-check';
          if (id.includes('/live-coach')) return 'live-coach';
          if (id.includes('/vision-board')) return 'vision-board';
          if (id.includes('/analytics')) return 'analytics';
          
          // Group utilities
          if (id.includes('/services')) return 'services';
          if (id.includes('/utils')) return 'utils';
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Warn on chunks > 1MB
  },
});
```

**Effort:** 2-3 hours

### Total Phase 3 Effort: 7-10 hours

---

## Phase 4: Documentation and Standards (MEDIUM PRIORITY)

### Issues Identified

1. **Inconsistent Error Handling** (MEDIUM)
   - Files: Throughout codebase
   - Issue: Different error patterns, no standardization
   - Examples: try/catch with different handling

2. **No Input Sanitization** (HIGH - Security)
   - Files: User input points
   - Issue: No XSS protection on user content
   - Impact: Potential security vulnerability

3. **No API Documentation** (MEDIUM)
   - Files: `src/services/apiClient.ts`, `src/services/syncService.ts`
   - Issue: No JSDoc, no OpenAPI spec
   - Impact: Hard to understand API surface

### Implementation Plan

#### Step 4.1: Standardize Error Handling
**File:** `src/utils/errorHandler.ts` (NEW)

```typescript
/**
 * Standard error types for Maeple
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SYNC = 'SYNC',
  CAMERA = 'CAMERA',
  AI = 'AI',
}

/**
 * Standard error class
 */
export class MaepleError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public originalError?: unknown,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MaepleError';
  }
}

/**
 * Error handler utilities
 */
export class ErrorHandler {
  /**
   * Wrap a function with error handling
   */
  static async handle<T>(
    operation: () => Promise<T>,
    options: {
      onError?: (error: MaepleError) => void;
      fallback?: T;
      errorType?: ErrorType;
      context?: Record<string, unknown>;
    } = {}
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const maepleError = this.normalizeError(error, options);
      
      if (options.onError) {
        options.onError(maepleError);
      }
      
      return options.fallback ?? null;
    }
  }

  /**
   * Normalize any error to MaepleError
   */
  static normalizeError(
    error: unknown,
    options: {
      errorType?: ErrorType;
      context?: Record<string, unknown>;
    } = {}
  ): MaepleError {
    if (error instanceof MaepleError) {
      return error;
    }

    if (error instanceof Error) {
      // Determine error type from message
      let errorType = options.errorType;
      
      if (!errorType) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorType = ErrorType.NETWORK;
        } else if (error.message.includes('localStorage') || error.message.includes('IndexedDB')) {
          errorType = ErrorType.STORAGE;
        } else if (error.message.includes('401')) {
          errorType = ErrorType.AUTHENTICATION;
        } else if (error.message.includes('403')) {
          errorType = ErrorType.AUTHORIZATION;
        } else if (error.message.includes('Circuit breaker')) {
          errorType = ErrorType.AI;
        }
      }

      return new MaepleError(
        errorType || ErrorType.VALIDATION,
        error.message,
        error,
        options.context
      );
    }

    return new MaepleError(
      ErrorType.VALIDATION,
      String(error),
      error,
      options.context
    );
  }

  /**
   * Log error consistently
   */
  static log(error: unknown, context?: Record<string, unknown>): void {
    const maepleError = this.normalizeError(error, { context });
    
    console.error(`[${maepleError.type}]`, maepleError.message, {
      context: maepleError.context,
      originalError: maepleError.originalError,
    });
  }
}
```

**Create error boundary component:**

**File:** `src/components/ErrorBoundary.tsx` (NEW)

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandler, MaepleError } from '@/utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: MaepleError, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const maepleError = ErrorHandler.normalizeError(error, {
      context: { componentStack: errorInfo.componentStack },
    });

    ErrorHandler.log(maepleError);

    if (this.props.onError) {
      this.props.onError(maepleError, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-8 bg-rose-50 text-rose-900 rounded-xl">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="mb-4">We're sorry, but an error occurred.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg"
            >
              Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

**Effort:** 3-4 hours

#### Step 4.2: Add Input Sanitization
**File:** `src/utils/sanitize.ts` (NEW)

```typescript
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
  });
}

/**
 * Sanitize plain text (remove HTML tags)
 */
export function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user input object
 */
export function sanitizeUserInput<T extends Record<string, unknown>>(
  input: T
): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      // Sanitize string values
      (sanitized as Record<string, unknown>)[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize objects
      (sanitized as Record<string, unknown>)[key] = sanitizeUserInput(value);
    } else {
      // Keep primitive values as-is
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }
  
  return sanitized;
}
```

**Install DOMPurify:**

```bash
npm install dompurify @types/dompurify
```

**Update components to use sanitization:**

**File:** `src/components/JournalEntry.tsx`

```typescript
import { sanitizeText } from '@/utils/sanitize';

// In handleSubmit:
const newEntry: HealthEntry = {
  id: uuidv4(),
  timestamp: new Date().toISOString(),
  rawText: sanitizeText(text), // SANITIZE USER INPUT
  mood: parsed.moodScore,
  // ... rest of entry
};
```

**Effort:** 2-3 hours

#### Step 4.3: Generate API Documentation
**Add JSDoc to apiClient.ts:**

```typescript
/**
 * MAEPLE API Client
 * 
 * Client for communicating with local MAEPLE API server.
 * Handles auth tokens and request/response formatting.
 * 
 * @module apiClient
 * @example
 * ```typescript
 * import { signUp, signIn, getEntries } from '@/services/apiClient';
 * 
 * // Sign up new user
 * const { user, error } = await signUp('user@example.com', 'password');
 * 
 * // Sign in existing user
 * const { user, error } = await signIn('user@example.com', 'password');
 * 
 * // Get all entries
 * const { entries, error } = await getEntries();
 * ```
 */

// API base URL - uses proxy server for proper routing
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

// Token storage key
const TOKEN_KEY = 'maeple_auth_token';

/**
 * User interface representing authenticated user
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User email address */
  email: string;
  /** User display name */
  displayName: string;
  /** Account creation timestamp */
  createdAt?: string;
}

/**
 * Authentication response containing user and token
 */
export interface AuthResponse {
  /** Authenticated user data */
  user: User;
  /** JWT authentication token */
  token: string;
}

/**
 * Sign up a new user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password (will be hashed server-side)
 * @param displayName - Optional display name for the user
 * @returns Promise resolving to user data or error
 * @example
 * ```typescript
 * const { user, error } = await signUp('user@example.com', 'password123', 'John Doe');
 * if (error) {
 *   console.error('Sign up failed:', error);
 * } else {
 *   console.log('Welcome,', user.displayName);
 * }
 * ```
 */
export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user?: User; error?: string }> {
  const { data, error } = await apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });

  if (error) {
    return { error };
  }

  if (data?.token) {
    setToken(data.token);
  }

  return { user: data?.user };
}

/**
 * Sign in an existing user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise resolving to user data or error
 * @example
 * ```typescript
 * const { user, error } = await signIn('user@example.com', 'password123');
 * if (error) {
 *   console.error('Sign in failed:', error);
 * }
 * ```
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user?: User; error?: string }> {
  const { data, error } = await apiRequest<AuthResponse>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (error) {
    return { error };
  }

  if (data?.token) {
    setToken(data.token);
  }

  return { user: data?.user };
}

// ... continue for all API methods
```

**Generate OpenAPI/Swagger spec:**

**File:** `api-spec.yaml` (NEW)

```yaml
openapi: 3.0.0
info:
  title: MAEPLE API
  version: 1.0.0
  description: API for MAEPLE neurodivergent health tracking application

servers:
  - url: http://localhost:3000/api
    description: Development server
  - url: https://api.maeple.app
    description: Production server

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

paths:
  /auth/signup:
    post:
      summary: Create new user account
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                displayName:
                  type: string
              required:
                - email
                - password
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  token:
                    type: string
        '400':
          description: Invalid input
        '409':
          description: Email already exists

  /auth/signin:
    post:
      summary: Sign in existing user
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
              required:
                - email
                - password
      responses:
        '200':
          description: Sign in successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  token:
                    type: string
        '401':
          description: Invalid credentials

  /entries:
    get:
      summary: Get all journal entries
      tags:
        - Entries
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List of entries
          content:
            application/json:
              schema:
                type: object
                properties:
                  entries:
                    type: array
                    items:
                      $ref: '#/components/schemas/Entry'
    post:
      summary: Create new journal entry
      tags:
        - Entries
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Entry'
      responses:
        '201':
          description: Entry created

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        displayName:
          type: string
        createdAt:
          type: string
          format: date-time

    Entry:
      type: object
      properties:
        id:
          type: string
        timestamp:
          type: string
          format: date-time
        rawText:
          type: string
        mood:
          type: integer
          minimum: 1
          maximum: 10
        neuroMetrics:
          type: object
          properties:
            spoonLevel:
              type: integer
            capacity:
              type: object
```

**Effort:** 3-4 hours

### Total Phase 4 Effort: 8-11 hours

---

## Summary & Recommendations

### Effort Summary

| Phase | Description | Priority | Effort |
|--------|-------------|-----------|---------|
| 1.3 | Background Sync Cleanup | HIGH | 3.5-5.5 hrs |
| 2 | Test Suite Improvements | HIGH | 7-8 hrs |
| 3 | Performance Optimization | MEDIUM | 7-10 hrs |
| 4 | Documentation & Standards | MEDIUM | 8-11 hrs |
| **Total** | **Phases 1.3-4** | | **25.5-34.5 hrs** |

### Deployment Sequence

**Week 1 (Immediate):**
- Complete Phase 1.3: Background Sync Cleanup
- Deploy to production
- Monitor for improvements

**Week 2-3 (Short-term):**
- Complete Phase 2: Test Suite Improvements
- Set up CI/CD pipeline
- Implement test coverage gating

**Week 4-6 (Medium-term):**
- Complete Phase 3: Performance Optimization
- Monitor bundle size and load times
- Optimize based on metrics

**Week 7-8 (Long-term):**
- Complete Phase 4: Documentation & Standards
- Generate public API documentation
- Implement comprehensive error monitoring

### Risk Assessment

| Risk | Impact | Mitigation |
|-------|---------|------------|
| Breaking changes in sync service | HIGH | Thorough testing before deployment |
| Test timeout fixes mask real issues | MEDIUM | Investigate root cause of slow tests |
| Cache key changes invalidate all cache | MEDIUM | Versioned cache keys, graceful migration |
| Code splitting affects SEO | LOW | Server-side rendering or pre-rendering |
| Input sanitization blocks legitimate content | LOW | Whitelist-based approach, user feedback |

### Success Metrics

**Phase 1.3:**
- [ ] No sync operations timeout (>60s)
- [ ] Pending queue stays < 100 items
- [ ] No stale entries (>7 days)

**Phase 2:**
- [ ] All tests pass with 10s timeout
- [ ] Zero React act warnings
- [ ] Test coverage > 70%

**Phase 3:**
- [ ] Initial bundle size < 500KB gzipped
- [ ] LCP < 2.5s on 3G
- [ ] Sync API calls reduced by 50%

**Phase 4:**
- [ ] All APIs documented with JSDoc
- [ ] OpenAPI spec published
- [ ] Error boundaries catch 100% of errors
- [ ] XSS vulnerabilities: 0

---

**Document Version:** 1.0  
**Last Updated:** February 1, 2026  
**Next Review:** After Phase 1.3 completion