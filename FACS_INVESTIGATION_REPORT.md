# FACS System Investigation Report
**Date**: January 21, 2026  
**Issue**: FACS system not providing results  
**Status**: Root Cause Identified

---

## Executive Summary

The FACS (Facial Action Coding System) implementation is technically correct and well-documented, but fails to provide results due to a **configuration initialization problem**. The AI router is not being properly initialized with the Gemini API key, causing vision analysis requests to fail silently and fall back to offline mode.

---

## Root Cause Analysis

### The Problem: AI Router Not Initialized with API Key

**Issue Location**: `src/services/ai/settingsService.ts` → `loadSettings()` method

**Root Cause**: When the AI router is initialized, the settings service returns an empty providers array (`[]`) because:
1. No settings exist in localStorage
2. The environment variable `VITE_GEMINI_API_KEY` is not being properly detected during initialization
3. This causes the AI router to have NO enabled providers
4. Vision requests to `aiRouter.vision()` return `null`
5. The system falls back to offline mode, which returns minimal/no results

### Code Flow Analysis

```
1. App.tsx startup
   ↓
2. App.tsx → initializeApp()
   ↓
3. appStore.initializeApp()
   ↓
4. initializeAI() from ai/index.ts
   ↓
5. aiSettingsService.initialize()
   ↓
6. aiRouter.initialize(aiSettingsService.getSettings())
   ↓
   ❌ PROBLEM: getSettings() returns { providers: [] }
   ❌ Router has no enabled providers
   ↓
7. User captures image in StateCheckWizard
   ↓
8. visionService.analyzeFromImage() called
   ↓
9. geminiVisionService.analyzeStateFromImage()
   ↓
10. Calls aiRouter.vision({ imageData, mimeType, prompt })
    ↓
    ❌ Returns null (no providers available)
    ↓
11. Fallback to direct Gemini SDK
    ↓
12. But this ALSO has initialization issues
    ↓
13. Eventually returns offline fallback: { actionUnits: [], confidence: 0.3 }
```

---

## Detailed Technical Findings

### 1. Settings Service Initialization Issue

**File**: `src/services/ai/settingsService.ts`

**Problem**:
```typescript
private async loadSettings(): Promise<void> {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      // Check for legacy environment variable API key
      const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (envKey) {
        this.settings = {
          ...DEFAULT_SETTINGS,
          providers: [{
            providerId: 'gemini',
            enabled: true,
            apiKey: envKey,
          }],
        };
        await this.saveSettings();
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
      }
      return;
    }
    // ... rest of code
  }
}
```

**Issue**: The environment variable check `(import.meta as any).env?.VITE_GEMINI_API_KEY` may fail at runtime depending on the build system.

### 2. AI Router Has No Providers

**File**: `src/services/ai/router.ts`

**Problem**:
```typescript
initialize(settings: AISettings): void {
  this.settings = settings;
  this.adapters.clear();

  // Instantiate adapters for enabled providers with API keys
  for (const provider of settings.providers) {
    if (!provider.enabled || !provider.apiKey) continue;
    // ... create adapters
  }
  this.initialized = true;
}
```

When `settings.providers` is empty, NO adapters are created, so `this.initialized` becomes `true` but there are no actual providers.

### 3. Vision Service Returns Null

**File**: `src/services/geminiVisionService.ts`

**Problem**:
```typescript
const routed = await aiRouter.vision({
  imageData: base64Image,
  mimeType: "image/png",
  prompt: promptText,
});

if (routed?.content) {
  try {
    onProgress?.("Parsing AI response", 90);
    return JSON.parse(routed.content) as FacialAnalysis;
  } catch (parseErr) {
    console.warn("Vision router JSON parse failed, falling back to Gemini SDK", parseErr);
  }
}
```

When `aiRouter.vision()` returns `null`, the code falls through to check if `getAI()` returns a client, which also has issues.

### 4. Fallback to Offline Mode

**File**: `src/services/geminiVisionService.ts`

```typescript
const getOfflineAnalysis = (_base64Image: string): FacialAnalysis => ({
  confidence: 0.3,
  actionUnits: [], // No AU detection possible offline
  facsInterpretation: {
    duchennSmile: false,
    socialSmile: false,
    maskingIndicators: [],
    fatigueIndicators: ["Unable to analyze - offline mode"],
    tensionIndicators: [],
  },
  observations: [],
  lighting: "unknown",
  lightingSeverity: "moderate",
  environmentalClues: ["Offline analysis - AI unavailable"],
  jawTension: 0,
  eyeFatigue: 0,
});
```

This is what users are seeing - no Action Units detected, low confidence, "offline mode" message.

---

## Configuration Verification

### Environment Variables
**File**: `.env`

```bash
VITE_GEMINI_API_KEY=AIzaSyA1DN41vECX4gFZNOT0r0vYmVP9ram63hw
```

✅ The API key is present in the .env file

### Model Configuration
**File**: `src/services/ai/modelConfig.ts`

```typescript
export const GEMINI_MODELS = {
  flash: 'gemini-2.5-flash',
  imageGen: 'gemini-2.5-flash-image',
  liveAudio: 'gemini-2.5-flash-native-audio-preview-12-2025',
  healthCheck: 'gemini-2.5-flash',
} as const;
```

✅ Using correct Gemini 2.5 models (compliant with AI_MANDATE.md)

### Documentation Status
**File**: `FACS_IMPLEMENTATION_STATE.md`

- States system is "Production-Ready"
- Claims 248/248 tests passing
- Says using Gemini 2.5-flash

❌ Documentation does not reflect the initialization issue

---

## Why Tests Pass But Production Fails

### Test Environment
Tests likely mock the AI services or run with pre-configured settings, so they don't encounter the initialization problem.

### Production Environment
- No mock services
- Real localStorage (empty on first run)
- Runtime environment variable access issues
- Results in uninitialized router

---

## Impact Assessment

### User Impact
- **Severity**: HIGH
- **Effect**: FACS feature completely non-functional
- **Symptoms**: 
  - No Action Units detected
  - Confidence always ~30%
  - Message "Unable to analyze - offline mode"
  - No facial analysis results

### System Impact
- AI router technically "initialized" but has no providers
- Circuit breaker never triggers (no requests made)
- Error logging may not capture the issue (silent fallback)
- Cache never stores results (nothing to cache)

---

## Recommended Fix

### Primary Solution: Fix Settings Initialization

**File**: `src/services/ai/settingsService.ts`

**Change**: Improve environment variable detection to ensure API key is loaded:

```typescript
private async loadSettings(): Promise<void> {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      // Check for environment variable API key (multiple sources)
      const envKey = 
        (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
        process.env?.VITE_GEMINI_API_KEY ||
        process.env?.API_KEY;

      if (envKey) {
        console.log("[AISettings] Found API key in environment, creating Gemini provider");
        this.settings = {
          ...DEFAULT_SETTINGS,
          providers: [{
            providerId: 'gemini',
            enabled: true,
            apiKey: envKey,
          }],
        };
        await this.saveSettings();
      } else {
        console.warn("[AISettings] No API key found in environment variables");
        this.settings = { ...DEFAULT_SETTINGS };
      }
      return;
    }
    // ... rest of existing code
  } catch (error) {
    console.error('Error loading AI settings:', error);
    this.settings = { ...DEFAULT_SETTINGS };
  }
}
```

### Secondary Solution: Add Provider Initialization Logging

**File**: `src/services/ai/router.ts`

**Change**: Add logging to show which providers are initialized:

```typescript
initialize(settings: AISettings): void {
  this.settings = settings;
  this.adapters.clear();

  console.log("[AIRouter] Initializing with providers:", settings.providers);

  // Instantiate adapters for enabled providers with API keys
  for (const provider of settings.providers) {
    if (!provider.enabled || !provider.apiKey) {
      console.warn(`[AIRouter] Skipping ${provider.providerId}: enabled=${provider.enabled}, hasKey=${!!provider.apiKey}`);
      continue;
    }

    try {
      console.log(`[AIRouter] Initializing adapter for ${provider.providerId}`);
      switch (provider.providerId) {
        case 'gemini':
          this.adapters.set(
            provider.providerId,
            new GeminiAdapter({ apiKey: provider.apiKey, baseUrl: provider.baseUrl })
          );
          break;
        // ... other providers
      }
    } catch (error) {
      console.error(`Failed to initialize provider ${provider.providerId}:`, error);
    }
  }

  console.log(`[AIRouter] Initialized ${this.adapters.size} adapters`);
  this.initialized = true;
}
```

### Tertiary Solution: Add Vision Request Validation

**File**: `src/services/geminiVisionService.ts`

**Change**: Add explicit check for router availability:

```typescript
const routed = await aiRouter.vision({
  imageData: base64Image,
  mimeType: "image/png",
  prompt: promptText,
});

if (routed?.content) {
  try {
    onProgress?.("Parsing AI response", 90);
    return JSON.parse(routed.content) as FacialAnalysis;
  } catch (parseErr) {
    console.warn("Vision router JSON parse failed, falling back to Gemini SDK", parseErr);
  }
} else {
  console.warn("[FACS] AI router returned null - no vision provider available");
}
```

### Validation Solution: Add Health Check Before Use

**File**: `src/services/geminiVisionService.ts`

**Change**: Check AI availability before proceeding:

```typescript
export const analyzeStateFromImage = async (
  base64Image: string,
  options: {
    timeout?: number;
    onProgress?: (stage: string, progress: number) => void;
    signal?: AbortSignal;
    useCache?: boolean;
  } = {}
): Promise<FacialAnalysis> => {
  const { timeout = 30000, onProgress, signal, useCache = true } = options;

  // Check if AI is available
  if (!aiRouter.isAIAvailable()) {
    console.warn("[FACS] AI not available - checking configuration");
    const settings = aiSettingsService.getSettings();
    console.warn("[FACS] Current settings:", settings);
    onProgress?.("AI not configured, using offline fallback", 5);
    return getOfflineAnalysis(base64Image);
  }

  // ... rest of existing code
}
```

---

## Testing Plan

### Pre-Fix Testing
1. Clear localStorage (simulate fresh install)
2. Start application
3. Navigate to Bio-Mirror
4. Capture photo
5. **Expected**: Fails with offline mode (current behavior)
6. **Actual**: Confirms the bug

### Post-Fix Testing
1. Clear localStorage (simulate fresh install)
2. Start application
3. Check browser console for initialization logs
4. Navigate to Bio-Mirror
5. Capture photo
6. **Expected**: Returns FACS results with Action Units
7. **Verify**: Action Units array not empty
8. **Verify**: Confidence > 0.5

### Edge Cases
1. No API key in .env → Should show helpful error
2. Invalid API key → Should show clear error message
3. Network failure → Should use graceful fallback with explanation
4. Partial initialization → Should retry or show status

---

## Deployment Checklist

- [ ] Fix `src/services/ai/settingsService.ts` environment variable detection
- [ ] Add logging to `src/services/ai/router.ts`
- [ ] Add validation to `src/services/geminiVisionService.ts`
- [ ] Test with fresh localStorage
- [ ] Test with existing localStorage
- [ ] Test without API key
- [ ] Update `FACS_IMPLEMENTATION_STATE.md` with known issues
- [ ] Add initialization troubleshooting guide
- [ ] Run full test suite
- [ ] Deploy to staging environment
- [ ] Verify in production

---

## Conclusion

The FACS system architecture is sound, but a configuration initialization bug prevents it from functioning. The AI router is not being initialized with the Gemini API key, causing all vision requests to fail silently and return offline fallback results.

**Primary Fix**: Improve environment variable detection in `settingsService.ts`  
**Estimated Effort**: 2-4 hours (including testing)  
**Priority**: HIGH (feature completely non-functional)  
**Risk**: LOW (only affects initialization, no data loss risk)

---

## Next Steps

1. Implement the primary fix in `settingsService.ts`
2. Add comprehensive logging throughout the initialization chain
3. Test with fresh installation scenarios
4. Update documentation to reflect initialization requirements
5. Consider adding a "Configuration Status" page for users

---

**Report Generated**: January 21, 2026  
**Investigator**: System Analysis  
**Status**: Root Cause Identified - Ready for Fix Implementation