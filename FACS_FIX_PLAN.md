# FACS System Fix Plan
**Date**: January 24, 2026
**Status**: 🔧 Implementation Phase

---

## Problem Analysis

### Root Cause Confirmed
The AI router is instantiated but `aiRouter.isAIAvailable()` returns `false`, causing immediate fallback to offline mode with empty results.

### Research Findings

**1. Router Initialization Sequence**
- `aiSettingsService.initialize()` loads settings from localStorage or environment
- `aiRouter.initialize(settings)` should create adapters and set `initialized = true`
- BUT: `isAIAvailable()` checks both `initialized` AND `providers.some(p => p.enabled && p.apiKey)`

**2. Potential Failure Points**
a) Settings loaded but provider is not enabled
b) Settings loaded but API key is null/undefined
c) Settings loaded but encryption/decryption fails
d) Race condition: settings not loaded when router initializes
e) localStorage is cleared/blocked

**3. Critical Code Path**
```typescript
// ai/router.ts - isAIAvailable()
isAIAvailable(): boolean {
  return this.initialized && (this.settings?.providers.some(p => p.enabled && p.apiKey) ?? false);
}

// If this returns false, geminiVisionService.ts does:
if (!isAvailable) {
  return getOfflineAnalysis(base64Image); // Empty results!
}
```

---

## Fix Strategy

### Phase 1: Diagnostic Enhancement (High Priority)
Add comprehensive logging to understand exact failure point

### Phase 2: Initialization Robustness (High Priority)
Fix timing and configuration issues

### Phase 3: Fallback Improvements (Medium Priority)
Add better fallback paths so system works even if router fails

### Phase 4: Verification (High Priority)
Test fixes and confirm system works

---

## Detailed Implementation Plan

### Fix 1: Enhanced Router Initialization Logging
**File**: `src/services/ai/router.ts`
**Purpose**: Log every step of initialization to identify exact failure
**Risk**: None (logging only)

### Fix 2: Settings Service Debug Logging
**File**: `src/services/ai/settingsService.ts`
**Purpose**: Verify environment variable is loaded correctly
**Risk**: None (logging only)

### Fix 3: Initialize AI Service Verification
**File**: `src/services/ai/index.ts`
**Purpose**: Confirm router is available after initialization
**Risk**: None (verification only)

### Fix 4: Fallback to Direct SDK
**File**: `src/services/geminiVisionService.ts`
**Purpose**: If router fails, try direct API call
**Risk**: Low (adds fallback path)

### Fix 5: Better Error Messages
**File**: `src/services/geminiVisionService.ts`
**Purpose**: Show user-friendly errors
**Risk**: None (UX improvement)

### Fix 6: Health Check Integration
**File**: `src/App.tsx`
**Purpose**: Verify AI health on startup
**Risk**: Low (adds diagnostic)

---

## Testing Plan

### Test 1: Static Code Analysis
Verify all fixes are implemented correctly

### Test 2: Runtime Initialization
Start app and check console logs for initialization sequence

### Test 3: Router Availability
Call `aiRouter.isAIAvailable()` in browser console

### Test 4: Network Requests
Monitor Network tab for Gemini API calls

### Test 5: End-to-End FACS
Capture image and verify results display

---

## Success Criteria

✅ `aiRouter.isAIAvailable()` returns `true`
✅ Console shows "Router initialized, available: true"
✅ Network tab shows Gemini API request
✅ FACS results contain `actionUnits` array
✅ Results display in UI with emotion + confidence
✅ No offline fallback errors in console

---

## Rollback Plan

If any fix causes issues:
1. Revert to previous version
2. Document what failed
3. Implement alternative solution
4. Re-test

---

## Implementation Order

1. Fix 1 (Router logging) - 5 minutes
2. Fix 2 (Settings logging) - 5 minutes
3. Fix 3 (Verification) - 5 minutes
4. Test initialization - 10 minutes
5. Fix 4 (Direct SDK fallback) - 10 minutes
6. Fix 5 (Error messages) - 5 minutes
7. Fix 6 (Health check) - 5 minutes
8. Full end-to-end test - 15 minutes

**Total Time**: ~60 minutes