# FACS System Worker MIME Type Error - Investigation and Fix

## Executive Summary

**Root Cause Identified**: The Vite build configuration is incorrectly outputting the web worker file with a `.ts` extension instead of `.js`, causing the browser to reject it with a MIME type error.

**Status**: Critical fix required - Worker files are not being properly compiled.

---

## Error Analysis

### Observed Error
```
Failed to load module script: The server responded with a non-JavaScript MIME type of "video/mp2t". 
Strict MIME type checking is enforced for module scripts per HTML spec.
```

### Location of Error
- File: `assets/imageProcessor.worker-CIlRsE8L.ts`
- Expected: `.js` extension
- Actual: `.ts` extension (TypeScript source, not compiled)

### Impact
- **Image compression fails** (though it falls back to alternative method)
- **Worker-based features are broken** (edge detection, advanced processing)
- **Console errors** during State Check Wizard usage
- **FACS system partially functional** (AI analysis works, but worker processing fails)

---

## Root Cause Analysis

### The Problem in Vite Config

**Current Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  worker: {
    format: 'es',
    plugins: () => [react()],
  },
  assetsInclude: ['**/*.worker.ts'],  // ❌ THIS IS THE PROBLEM
  // ... rest of config
});
```

### Why This Is Wrong

1. **`assetsInclude: ['**/*.worker.ts']`** tells Vite to treat `.worker.ts` files as **static assets**
   - Static assets are NOT compiled/transpiled
   - They are copied as-is to the dist folder
   - Result: `imageProcessor.worker.ts` stays as TypeScript source

2. **The worker configuration alone is insufficient** when `assetsInclude` overrides it
   - Vite's worker build process is bypassed
   - No TypeScript → JavaScript compilation occurs

3. **Browser cannot execute TypeScript directly**
   - Module scripts must be JavaScript
   - Browser sees `.ts` extension and rejects the file
   - Server returns incorrect MIME type for the unrecognized `.ts` extension

### Expected Behavior

Without the problematic `assetsInclude` line:
```typescript
worker: {
  format: 'es',
  plugins: () => [react()],
}
```

Vite would:
1. Detect `imageProcessor.worker.ts` as a worker file
2. Apply worker-specific build process
3. Compile TypeScript → JavaScript
4. Output: `imageProcessor.worker-[hash].js`
5. Browser loads it correctly as a module script

---

## Technical Details

### Worker File Structure

**Source**: `Maeple/src/workers/imageProcessor.worker.ts`
- TypeScript module with worker logic
- Uses ES6 modules and modern JavaScript
- Implements image processing (resize, edge detection, compression)

**Current Build Output**: `Maeple/dist/assets/imageProcessor.worker-CIlRsE8L.ts` ❌
- Not compiled
- Still TypeScript source code
- Unusable in browser

**Expected Build Output**: `Maeple/dist/assets/imageProcessor.worker-CIlRsE8L.js` ✅
- Compiled to JavaScript
- ESM format
- Ready for browser execution

### Worker Loading Code

**File**: `Maeple/src/services/imageWorkerManager.ts`
```typescript
const workerUrl = new URL(
  '../workers/imageProcessor.worker.ts',
  import.meta.url
);

this.worker = new Worker(workerUrl, { type: 'module' });
```

This code expects Vite to:
1. Detect the `.ts` extension
2. Process it through the worker build pipeline
3. Return a URL to the compiled `.js` file

But due to `assetsInclude`, Vite returns the uncompiled `.ts` file URL.

---

## Investigation Findings

### What Works
- ✅ AI Router initialization
- ✅ Gemini API connection
- ✅ API key detection and configuration
- ✅ VisionServiceAdapter circuit breaker
- ✅ Image capture (camera)
- ✅ Image compression fallback (non-worker method)
- ✅ FACS analysis (via direct Gemini SDK calls)

### What's Broken
- ❌ Web worker initialization
- ❌ Worker-based image compression
- ❌ Edge detection processing
- ❌ Any worker-based image processing

### Why AI Analysis Still Works

The FACS analysis succeeds because:
1. The VisionServiceAdapter has a fallback path
2. When the worker fails, the system uses alternative compression methods
3. The actual AI analysis goes through `geminiVisionService.ts` directly
4. This bypasses the worker entirely and calls Gemini API directly

Logs show:
```
[VisionServiceAdapter] Circuit breaker passed, importing vision service
[DirectGemini] Making direct API call to Gemini SDK
```

The error message is misleading because:
- It says "Failed to load module script"
- This is about the worker file, NOT the AI analysis
- The AI analysis proceeds successfully via the direct SDK path
- Only worker-based features are affected

---

## The Fix

### Solution 1: Remove `assetsInclude` (Recommended)

**File**: `Maeple/vite.config.ts`

**Remove this line**:
```typescript
assetsInclude: ['**/*.worker.ts'],  // DELETE THIS LINE
```

**Explanation**: This allows Vite's built-in worker handling to process the file correctly.

### Solution 2: Explicit Worker Configuration (Alternative)

If solution 1 doesn't work, explicitly configure worker plugin:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      // Include worker files in JSX transformation if needed
      include: /\.(tsx|ts|js|jsx|worker.ts)$/,
    }),
    copyServiceWorker()
  ],
  worker: {
    format: 'es',
    plugins: () => [react()],
    // Explicitly include worker files
    include: ['**/*.worker.ts'],
  },
  // Remove assetsInclude line completely
  // ❌ assetsInclude: ['**/*.worker.ts'],
  
  // ... rest of config remains the same
});
```

---

## Implementation Steps

### Step 1: Apply the Fix
1. Open `Maeple/vite.config.ts`
2. Remove the line: `assetsInclude: ['**/*.worker.ts'],`
3. Save the file

### Step 2: Clean Build
```bash
cd Maeple
rm -rf dist
npm run build
```

### Step 3: Verify Output
Check that worker file now has `.js` extension:
```bash
ls -la Maeple/dist/assets/ | grep worker
```

Expected output:
```
imageProcessor.worker-CIlRsE8L.js  # Note the .js extension
```

### Step 4: Test
```bash
npm run dev
```

Open browser console and verify:
1. No MIME type error
2. Worker loads successfully
3. Image compression works
4. State Check Wizard completes without errors

---

## Verification Checklist

After applying the fix:

- [ ] Worker file in dist/assets has `.js` extension
- [ ] No "non-JavaScript MIME type" errors in console
- [ ] Worker initializes successfully
- [ ] Image compression completes
- [ ] State Check Wizard works end-to-end
- [ ] FACS analysis completes with worker support
- [ ] No fallback to alternative compression methods

---

## Additional Recommendations

### 1. Add Worker Error Handling

**File**: `Maeple/src/services/imageWorkerManager.ts`

The error handling is already good, but could be enhanced:

```typescript
this.worker.onerror = (error) => {
  console.error('[ImageWorkerManager] Worker error:', error);
  
  // Log specific error type for debugging
  if (error.message?.includes('MIME type')) {
    errorLogger.error('Worker MIME type error - build configuration issue', {
      error: error.message,
      suggestion: 'Check vite.config.ts assetsInclude configuration'
    });
  }
  
  this.cleanup();
  reject(new Error('Worker initialization failed'));
};
```

### 2. Add Worker Health Check

Add a health check method to verify worker functionality:

```typescript
public async healthCheck(): Promise<boolean> {
  try {
    await this.initializeWorker();
    if (!this.worker) return false;
    
    // Send ping message
    return new Promise((resolve) => {
      const id = uuidv4();
      const timeout = setTimeout(() => resolve(false), 5000);
      
      this.requests.set(id, {
        id,
        type: 'resize' as ProcessType,
        imageData: new ImageData(1, 1),
        resolve: () => { clearTimeout(timeout); resolve(true); },
        reject: () => { clearTimeout(timeout); resolve(false); }
      });
      
      this.worker!.postMessage({ id, type: 'ping' });
    });
  } catch {
    return false;
  }
}
```

### 3. Monitor Worker Performance

Track worker performance metrics:

```typescript
// Add to existing stats interface
interface WorkerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  activeRequests: number;
  // New metrics
  lastUsed: Date;
  initializationTime: number;
  errorRate: number;
}
```

---

## Related Documentation

- Vite Worker Configuration: https://vitejs.dev/guide/features.html#web-workers
- TypeScript Workers: https://vitejs.dev/guide/features.html#typescript-with-workers
- Web Workers API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API

---

## Summary

**Problem**: Vite configuration prevents worker compilation
**Solution**: Remove `assetsInclude: ['**/*.worker.ts']` line
**Impact**: Fixes worker-based image processing
**Risk**: Low - simple configuration change
**Testing**: Required after rebuild

The misleading error message ("API is right, code is wrong") is actually correct - the worker file is not being properly built due to a Vite configuration issue, not an API or code logic problem.