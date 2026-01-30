# FACS System Debugging Guide

## Issue Summary

The FACS (Facial Action Coding System) is not returning results - showing empty arrays and "offline mode" messages instead of actual Action Unit detection.

## Root Cause Analysis

The issue was traced to **AI router not being initialized** with a provider configuration, causing the system to fall back to offline mode.

### Architecture Flow

```
App.tsx → AppContent() → initializeApp()
                    ↓
              → appStore.initializeApp()
                    ↓
              → initializeAI() [from src/services/ai/index.ts]
                    ↓
              → aiSettingsService.initialize()
                    ↓
              → Check environment for VITE_GEMINI_API_KEY
                    ↓
              → Create providers array or load from localStorage
                    ↓
              → aiRouter.initialize(settings)
```

## Fixes Implemented

### 1. Enhanced Environment Variable Detection (`src/services/ai/settingsService.ts`)

**Problem**: Environment variable detection was silent, making it hard to debug.

**Fix**: Added comprehensive logging to show:
- Whether `import.meta` is available
- Whether `VITE_GEMINI_API_KEY` is found in `import.meta.env`
- Whether `process` is available
- Whether `process.env.VITE_GEMINI_API_KEY` or `process.env.API_KEY` is found
- API key length (first 4 chars for security)
- Whether providers were created successfully

**Expected Logs**:
```javascript
[AISettings] Environment variable check: {
  hasImportMeta: true,
  hasViteEnv: false,  // or true if key found
  hasProcessEnv: false,
  foundKey: false  // or true if key found
}
[AISettings] Found API key in environment, creating Gemini provider
[AISettings] API key length: 39 (showing first 4 chars: abcd...)
[AISettings] Settings saved successfully with 1 provider(s)
```

### 2. Enhanced Router Initialization Logging (`src/services/ai/router.ts`)

**Problem**: Router initialization had no visibility into what was happening.

**Fix**: Added detailed logging showing:
- Total provider count
- Each provider's status (enabled, hasKey, keyLength)
- Which providers are being skipped and why
- Which adapters are being created
- Final count of initialized adapters
- List of available provider IDs

**Expected Logs**:
```javascript
[AIRouter] Initializing with settings: {
  providerCount: 1,
  providers: [
    {
      id: 'gemini',
      enabled: true,
      hasKey: true,
      keyLength: 39
    }
  ]
}
[AIRouter] Initializing adapter for gemini
[AIRouter] Successfully initialized gemini adapter
[AIRouter] Initialization complete: 1 adapters ready
[AIRouter] Available providers: ['gemini']
```

### 3. AI Availability Check (`src/services/geminiVisionService.ts`)

**Problem**: Vision service would try to analyze image even if AI wasn't configured, leading to confusion.

**Fix**: Added early check:
```typescript
// Check if AI is available before proceeding
if (!aiRouter.isAIAvailable()) {
  console.warn("[FACS] AI not available - checking configuration");
  onProgress?.("AI not configured, using offline fallback", 5);
  return getOfflineAnalysis(base64Image);
}
```

**Expected Behavior**:
- Immediately returns offline fallback if no providers configured
- Shows clear message: "AI not configured, using offline fallback"
- Prevents wasted API calls

## Debugging Steps

### Step 1: Clear All Data and Restart

**Why**: Remove any cached settings that might be incorrect.

**Commands**:
```javascript
// In browser console
localStorage.clear()
location.reload()
```

### Step 2: Check Browser Console Logs

**Open browser console** (F12 or Cmd+Option+I) and look for:

#### Expected Success Logs:
```
[AppStore] AI initialization succeeded
[AISettings] Environment variable check: {...}
[AISettings] Found API key in environment, creating Gemini provider
[AISettings] API key length: 39 (showing first 4 chars: abcd...)
[AIRouter] Initializing with settings: {...}
[AIRouter] Successfully initialized gemini adapter
[FACS] AI provider available
[FACS] AI availability check: true
```

#### Problem Scenarios:

**Scenario 1: Environment Variable Not Found**
```
[AISettings] Environment variable check: {
  hasImportMeta: true,
  hasViteEnv: false,
  hasProcessEnv: false,
  foundKey: false
}
[AISettings] No API key found in environment variables
[AISettings] Application will run in offline mode unless API key is configured in Settings
```
**Solution**: Add `VITE_GEMINI_API_KEY=your_key_here` to `.env` file

---

**Scenario 2: Settings Service Not Initialized**
```
[FACS] AI not available - checking configuration
```
**Solution**: Check if `aiSettingsService.initialize()` is being called. Look for:
```
[AppStore] initializeApp:ai
```
or
```
initializeApp:error AI initialization failed: ...
```

---

**Scenario 3: Router Initialization Failing**
```
[AIRouter] Skipping gemini: enabled=true, hasKey=false
```
**Solution**: The API key was found but is empty or invalid. Check the API key value.

---

**Scenario 4: Vision Service Error**
```
[FACS] AI provider available
[...later...]
Vision Analysis Error: TypeError: Cannot read property 'text' of undefined
```
**Solution**: Check Gemini API response format in `geminiVisionService.ts`

### Step 3: Check Environment Variable Setup

#### For Vite Development:

**File**: `Maeple/.env`
```bash
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

**Verify**: Check that the `.env` file is in the `Maeple` directory.

#### For Production Build:

Environment variables are injected at build time. Check:
- Deployment configuration (Vercel, Netlify, etc.)
- Build script in `package.json`
- CI/CD pipeline variables

#### Runtime Verification:

**Run this in browser console**:
```javascript
console.log('import.meta.env:', import.meta.env)
console.log('VITE_GEMINI_API_KEY:', import.meta.env?.VITE_GEMINI_API_KEY)
console.log('Has API key:', !!import.meta.env?.VITE_GEMINI_API_KEY)
```

### Step 4: Verify Router State

**Run this in browser console**:
```javascript
// Check if router is initialized
console.log('Router initialized:', aiRouter.isInitialized)

// Check if AI is available
console.log('AI available:', aiRouter.isAIAvailable())

// Get current settings
import { aiSettingsService } from './path/to/ai/settingsService'
const settings = aiSettingsService.getSettings()
console.log('Current settings:', settings)
```

**Expected Results**:
- `isInitialized`: true
- `isAIAvailable()`: true
- `settings.providers`: Array with at least 1 provider

### Step 5: Test Vision Service Directly

**Run this in browser console**:
```javascript
import { aiRouter } from './path/to/services/ai/router'

// Check if router has vision capability
console.log('Has vision:', aiRouter.hasCapability('vision'))

// Try a simple vision request
const result = await aiRouter.vision({
  imageData: 'test_base64_string',
  mimeType: 'image/png',
  prompt: 'Describe this image'
})
console.log('Vision result:', result)
```

**Expected**: Result object with `content` field containing AI response.

## Common Issues

### Issue: "VITE_GEMINI_API_KEY is not defined"

**Cause**: Vite doesn't load `.env` file automatically.

**Solutions**:
1. **Restart dev server** after adding `.env` file:
   ```bash
   npm run dev
   ```

2. **Check `.env` file location**: Must be in project root (`Maeple/.env`)

3. **Verify `.env` format**: No spaces around `=`:
   ```bash
   # Correct
   VITE_GEMINI_API_KEY=your_key
   
   # Wrong
   VITE_GEMINI_API_KEY = your_key
   ```

### Issue: Multiple Import Statements

**Cause**: Some files import from `./ai/index.ts` multiple times.

**Solution**: Already fixed - router is a singleton exported directly.

### Issue: Circuit Breaker Triggering

**Cause**: Too many failed API calls cause the circuit breaker to open.

**Solution**: Check Gemini API key is valid and has quota available.

## Verification Checklist

Before reporting the issue as still broken, verify:

- [ ] Browser console shows `[AISettings] Found API key in environment`
- [ ] Browser console shows `[AIRouter] Successfully initialized gemini adapter`
- [ ] Browser console shows `[AIRouter] Available providers: ['gemini']`
- [ ] `aiRouter.isInitialized()` returns `true` in console
- [ ] `aiRouter.isAIAvailable()` returns `true` in console
- [ ] Environment variable `VITE_GEMINI_API_KEY` is defined (check with `console.log(import.meta.env?.VITE_GEMINI_API_KEY)`)
- [ ] When capturing photo, console shows `[FACS] AI provider available`
- [ ] When capturing photo, FACS result has non-empty `actionUnits` array
- [ ] When capturing photo, FACS result has `confidence > 0.5`

## Expected FACS Result Structure

When working correctly, the FACS analysis should return:

```json
{
  "confidence": 0.85,
  "actionUnits": [
    {
      "auCode": "AU6",
      "name": "Cheek Raiser",
      "intensity": "C",
      "intensityNumeric": 3,
      "confidence": 0.9
    },
    {
      "auCode": "AU12",
      "name": "Lip Corner Puller",
      "intensity": "B",
      "intensityNumeric": 2,
      "confidence": 0.8
    }
  ],
  "facsInterpretation": {
    "duchennSmile": true,
    "socialSmile": false,
    "maskingIndicators": [],
    "fatigueIndicators": [],
    "tensionIndicators": []
  },
  "observations": [
    "Subject showing genuine smile with AU6 and AU12 activation"
  ],
  "lighting": "soft natural",
  "lightingSeverity": "low",
  "environmentalClues": ["plain background"],
  "jawTension": 0.2,
  "eyeFatigue": 0.1
}
```

## Next Steps for Debugging

1. **Clear localStorage and reload**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

2. **Check console logs** as shown in "Step 2" above

3. **Report the exact console output** you see

4. **If environment variable not found**, verify:
   - `.env` file exists in `Maeple` directory
   - Dev server was restarted after creating `.env`
   - API key is valid (not empty)

5. **If router not initializing**, check:
   - No errors in console before initialization
   - JavaScript is loading correctly
   - No conflicting service instances

## Contact Information

If after following all steps the issue persists:

1. **Copy all console logs** from the moment you open the app to when you try to capture a photo
2. **Verify environment setup** matches your development environment
3. **Check for any proxy/network issues** that might block API calls
4. **Verify API key is valid** and has quota remaining

## Summary

The FACS system should now:
- ✅ Show detailed environment variable detection logs
- ✅ Show router initialization progress
- ✅ Check AI availability before attempting analysis
- ✅ Provide clear error messages when AI is not configured
- ✅ Fail gracefully to offline mode only when truly necessary

If these fixes don't resolve the issue, the console logs will reveal exactly where the problem is occurring.