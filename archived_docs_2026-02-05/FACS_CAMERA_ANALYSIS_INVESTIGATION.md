# FACS Camera-to-Analysis Investigation

**Date:** January 28, 2026  
**Issue:** Camera captures photo, but FACS system returns no results

---

## Executive Summary

Based on comprehensive code review, I've identified the complete data flow and potential failure points. The issue is likely in the **AI Router initialization** or **API key configuration**, not the camera capture itself.

---

## Complete Data Flow

```
1. User opens Bio-Mirror (StateCheckWizard)
2. Camera capture via useCameraCapture hook
3. Image compressed and converted to base64
4. VisionServiceAdapter.analyzeFromImage() called
5. CircuitBreaker.execute() wraps the call
6. geminiVisionService.analyzeStateFromImage() called
7. Check: aiRouter.isAIAvailable()
   ├─ TRUE → aiRouter.vision() → API call
   ├─ FALSE → Direct SDK call
   └─ FALSE + NO KEY → Offline fallback (empty results)
8. Parse response
9. Display in StateCheckResults
```

---

## Code Review Findings

### ✅ Camera Capture (useCameraCapture.ts)
**Status: WORKING**

- Properly implements MediaStream handling
- Returns base64 image data
- Debug logging shows "Capture successful"
- No issues found in camera logic

### ✅ StateCheckWizard.tsx
**Status: WORKING**

- Properly orchestrates the flow
- Calls visionService.analyzeFromImage()
- Handles errors and progress callbacks
- No issues found

### ✅ VisionServiceAdapter (serviceAdapters.ts)
**Status: WORKING**

- Circuit breaker wraps the call
- Imports geminiVisionService dynamically
- Logs results properly
- No issues found

### ⚠️ AI Router (router.ts)
**Potential Issue: isAIAvailable() logic**

```typescript
isAIAvailable(): boolean {
  const hasSettings = !!this.settings;
  const isInit = this.initialized;
  const hasKeys = this.settings?.providers.some(p => p.enabled && p.apiKey) ?? false;
  const result = isInit && hasKeys;  // CRITICAL LINE
  
  console.log("[AIRouter] isAIAvailable() check:", {
    hasSettings,
    initialized: isInit,
    providerCount: this.settings?.providers.length ?? 0,
    hasEnabledProviders: hasEnabled,
    hasProvidersWithKeys: hasKeys,
    result
  });
  
  return result;
}
```

**Potential Failure:**
- If `this.settings` is `null`, returns `false`
- If `this.initialized` is `false`, returns `false`
- If no providers have API keys, returns `false`

### ⚠️ AI Settings Service (settingsService.ts)
**Potential Issue: localStorage vs Environment Variable Priority**

```typescript
async loadSettings(): Promise<void> {
  const stored = localStorage.getItem(SETTINGS_KEY);
  
  if (!stored) {
    // Only checks environment if localStorage is EMPTY
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (envKey) {
      this.settings = {
        providers: [{
          providerId: 'gemini',
          enabled: true,
          apiKey: envKey,
        }]
      };
    }
  }
}
```

**Potential Failure:**
- If localStorage has old settings (without API key), it uses those
- Does NOT update from environment if settings already exist
- Requires clearing localStorage to get new env key

### ⚠️ Gemini Vision Service (geminiVisionService.ts)
**Critical Logic Path:**

```typescript
const isAvailable = aiRouter.isAIAvailable();

if (!isAvailable) {
  console.warn("[FACS] AI router not available, attempting direct SDK fallback");
  
  const ai = getAI();  // Tries to use direct SDK
  if (ai) {
    try {
      const result = await makeDirectGeminiCall(...);
      return result;
    } catch (directError) {
      console.warn("[FACS] Direct SDK call failed, using offline fallback");
    }
  }
  
  // FALLBACK: Offline mode with EMPTY results
  return getOfflineAnalysis(base64Image);
}
```

**The Problem:**
If `aiRouter.isAIAvailable()` returns `false` AND direct SDK also fails, it returns **empty results**.

---

## Root Cause Analysis

### Most Likely Cause #1: localStorage Stale Settings

**Scenario:**
1. User previously ran the app without API key
2. Settings saved to localStorage (empty)
3. Now API key exists in .env
4. Settings service loads from localStorage first
5. Router initialized with empty providers
6. `isAIAvailable()` returns `false`
7. FACS returns offline fallback (empty results)

**Evidence:**
```typescript
// In settingsService.ts line 48-49
if (!stored) {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;  // ONLY if !stored
```

### Most Likely Cause #2: Router Not Initialized Before First Use

**Scenario:**
1. `initializeAI()` called in App.tsx
2. Settings loaded and router initialized
3. BUT: Router might not be fully ready when first vision request comes in
4. `isAIAvailable()` returns `false`
5. Falls back to offline mode

**Evidence:**
```typescript
// In App.tsx line 44-45
await initializeAI();  // Async initialization
// Vision requests might happen before this completes?
```

### Most Likely Cause #3: Environment Variable Not Loading

**Scenario:**
1. `.env` file has API key
2. Vite not restarting after .env change
3. `import.meta.env.VITE_GEMINI_API_KEY` returns `undefined`
4. Settings created without API key
5. No providers available

**Evidence:**
- Dev server started on port 5173 (not 5172 from previous session)
- May need to restart Vite to pick up .env changes

---

## Verification Steps

### Step 1: Check Browser Console Logs

Open http://localhost:5173/ and look for:

```
[App] ===== APP INITIALIZATION START =====
[App] Initializing AI services...
[AI] ===== INITIALIZE AI SERVICES START =====
[AISettings] ===== INITIALIZE START =====
[AISettings] Loading settings...
[AIRouter] ===== INITIALIZE START =====
```

**What to look for:**
1. Does `[AISettings]` find the environment variable?
2. Does `[AIRouter]` show providers with keys?
3. Does `[AIRouter] isAIAvailable()` return `true` or `false`?

### Step 2: Check AI Health

Look for:
```
[App] Running AI health check...
[App] AI Health check results: { gemini: true/false }
[App] Healthy providers: 0/1
```

**If `0/1`:** No providers are healthy, FACS will fail
**If `1/1`:** Providers are working, issue is elsewhere

### Step 3: Test Camera Flow

1. Navigate to Bio-Mirror (/bio-mirror)
2. Open camera
3. Take photo
4. Watch console for:

```
[useCameraCapture] Capture successful
[VisionServiceAdapter] analyzeFromImage called
[VisionServiceAdapter] Image data length: XXXXX
[GeminiVision] analyzeStateFromImage called
[GeminiVision] AI router available: true/false
```

**If "AI router available: false":** Router initialization issue
**If "AI router available: true":** Check API call logs

---

## Debugging Commands

### Clear Local Storage (Fix Cause #1)

```bash
# Option 1: Browser DevTools
# 1. Open DevTools (F12)
# 2. Go to Application tab
# 3. Local Storage → localhost:5173
# 4. Right-click → Clear

# Option 2: Programmatic
# Add to browser console:
localStorage.clear();
location.reload();
```

### Restart Dev Server (Fix Cause #3)

```bash
cd Maeple
# Kill existing
pkill -f vite
# Restart to pick up .env changes
npm run dev
```

### Verify Environment Variable Loading

Add to browser console during initialization:
```javascript
console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY);
console.log('All VITE_ keys:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
```

---

## Proposed Fixes

### Fix #1: Force Environment Variable Priority

**File:** `Maeple/src/services/ai/settingsService.ts`

```typescript
async loadSettings(): Promise<void> {
  const stored = localStorage.getItem(SETTINGS_KEY);
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;

  // NEW: Always check environment variable first
  if (envKey && (!stored || envKey !== storedKey)) {
    console.log("[AISettings] Using environment API key");
    this.settings = {
      ...DEFAULT_SETTINGS,
      providers: [{
        providerId: 'gemini',
        enabled: true,
        apiKey: envKey,
      }]
    };
    await this.saveSettings();  // Save to localStorage
    return;
  }

  // Original logic for localStorage
  if (stored) {
    // ... existing logic
  }
}
```

### Fix #2: Add Router Ready State

**File:** `Maeple/src/services/ai/router.ts`

```typescript
class AIRouter {
  private ready = false;  // NEW flag

  initialize(settings: AISettings): void {
    // ... existing logic
    this.ready = true;  // Set ready at end
  }

  isAIAvailable(): boolean {
    return this.ready && this.initialized && hasKeys;
  }
}
```

### Fix #3: Add Fallback to Direct SDK

**File:** `Maeple/src/services/geminiVisionService.ts`

```typescript
const isAvailable = aiRouter.isAIAvailable();

if (!isAvailable) {
  console.warn("[FACS] AI router not available, trying direct SDK");
  
  // Try direct SDK FIRST before giving up
  const ai = getAI();
  if (ai) {
    try {
      const result = await makeDirectGeminiCall(base64Image, promptText, onProgress, timeout, signal);
      console.log("[FACS] Direct SDK SUCCESS:", result);
      return result;
    } catch (directError) {
      console.error("[FACS] Direct SDK failed:", directError);
    }
  }
  
  // Last resort: offline fallback
  return getOfflineAnalysis(base64Image);
}
```

---

## Testing Checklist

- [ ] Open http://localhost:5173/
- [ ] Clear browser localStorage
- [ ] Check console for `[AIRouter] isAIAvailable(): true`
- [ ] Navigate to Bio-Mirror
- [ ] Open camera and capture photo
- [ ] Check console for `[FACS] AI router available: true`
- [ ] Verify API call is made (network tab)
- [ ] Check for FACS results in console
- [ ] Verify results displayed in UI

---

## Next Steps

1. **Immediate:** Clear localStorage and restart dev server
2. **Verify:** Check console logs for router availability
3. **Test:** Run camera-to-FACS flow
4. **If still fails:** Check network tab for actual API call
5. **If API call fails:** Verify API key is valid and not expired
6. **If API call succeeds but empty:** Check response parsing

---

## Additional Notes

**API Key Status:**
- Environment variable: `AIzaSyDrabqx8o0vF9dQQef5o9vLm51g_-RDip0`
- Format: Valid Gemini API key format (starts with "AIza")
- Expiration: Needs verification via Google Cloud Console

**Dev Server Status:**
- Port: 5173
- Status: Running
- Vite version: 7.2.7

**Browser Requirements:**
- Camera permission: Required
- LocalStorage: Required for settings
- Network connection: Required for AI API