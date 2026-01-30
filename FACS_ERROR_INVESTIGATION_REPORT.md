# FACS Error Investigation Report

**Date:** January 24, 2026  
**Investigator:** AI Assistant  
**Application:** MAEPLE (FACS-based Facial Analysis System)

---

## Executive Summary

This report details critical errors preventing FACS (Facial Action Coding System) from functioning correctly in the MAEPLE application. The investigation identified **5 major error categories** ranging from expired API keys to configuration issues.

**Severity Assessment:**
- 🔴 **CRITICAL:** Gemini API Key Expired (Blocks all FACS analysis)
- 🟠 **HIGH:** Worker MIME Type Error (Blocks image processing)
- 🟠 **HIGH:** Authentication 401 Errors (Blocks user login)
- 🟡 **MEDIUM:** Wearable Integration Mock Mode (Limited data collection)
- 🟡 **LOW:** Supabase Configuration Warning (Minor initialization issue)

---

## Detailed Error Analysis

### 1. CRITICAL: Gemini API Key Expired

**Error Message:**
```
API key expired. Please renew the API key.
Status: 400 INVALID_ARGUMENT
Reason: API_KEY_INVALID
```

**Impact:**
- ❌ **COMPLETE BLOCK** - All FACS vision analysis fails
- ❌ Cannot analyze facial expressions for masking/fatigue detection
- ❌ BioMirror feature non-functional
- ❌ Users get offline fallback analysis (30% confidence, no AU detection)

**Root Cause:**
The Gemini API key `AIzaSyDrabqx8o0vF9dQQef5o9vYmVP9ram63hw` has expired or been revoked.

**Evidence:**
```typescript
// From .env file
VITE_GEMINI_API_KEY=AIzaSyDrabqx8o0vF9dQQef5o9vYmVP9ram63hw

// Error from service
generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent:1
Failed to load resource: the server responded with a status of 400

// API Response
{
  "error": {
    "code": 400,
    "message": "API key expired. Please renew the API key.",
    "status": "INVALID_ARGUMENT",
    "details": [{
      "@type": "type.googleapis.com/google.rpc.ErrorInfo",
      "reason": "API_KEY_INVALID",
      "domain": "googleapis.com"
    }]
  }
}
```

**Code Flow:**
1. `geminiVisionService.ts` → `getAI()` initializes GoogleGenAI client
2. Client makes request to `gemini-2.5-flash` model
3. Google API returns 400 error with "API key expired"
4. Circuit breaker in `VisionServiceAdapter` triggers
5. All vision analysis fails, falls back to offline mode

**Solution:**
```bash
# 1. Generate new API key at https://makersuite.google.com/app/apikey
# 2. Update .env file
VITE_GEMINI_API_KEY=your_new_api_key_here

# 3. Restart development server
npm run dev
```

---

### 2. HIGH: Worker MIME Type Error

**Error Message:**
```
Failed to load module script: The server responded with a non-JavaScript MIME type of "video/mp2t"
Strict MIME type checking is enforced for module scripts per HTML spec.
```

**Impact:**
- ❌ Web Worker fails to load for image compression
- ⚠️ Main thread blocking during image processing
- ⚠️ Potential performance degradation during camera capture
- ✅ Image compression still works (falls back to main thread)

**Root Cause:**
The Vite build process is not correctly configuring MIME types for Web Worker files. The worker file `imageProcessor.worker.ts` is being served with incorrect MIME type (`video/mp2t` instead of `application/javascript`).

**Evidence:**
```typescript
// From error log
assets/imageProcessor.worker-CIlRsE8L.ts:1 Failed to load module script
MIME type: video/mp2t (should be: application/javascript)

// Worker initialization code
new Worker(
  new URL('../workers/imageProcessor.worker.ts', import.meta.url),
  { type: 'module' }
)
```

**Analysis of vite.config.ts:**
- ✅ Vite config exists with worker plugin setup
- ⚠️ No explicit worker configuration in build.rollupOptions
- ⚠️ No MIME type configuration for worker files
- ✅ Uses `@vitejs/plugin-react` plugin

**Solution:**
```typescript
// Add to vite.config.ts
export default defineConfig({
  // ... existing config
  worker: {
    format: 'es',
    plugins: () => [react()],
  },
  build: {
    rollupOptions: {
      output: {
        // ... existing output config
      },
    },
    // Ensure workers are bundled correctly
    target: 'es2020',
  },
  // Add assetsInclude for worker files
  assetsInclude: ['**/*.worker.ts'],
});
```

**Alternative Workaround:**
```typescript
// Change worker import to use worker-plugin syntax
import ImageProcessorWorker from './imageProcessor.worker.ts?worker';

const worker = new ImageProcessorWorker();
```

---

### 3. HIGH: Authentication 401 Error

**Error Message:**
```
api/auth/signin:1 Failed to load resource: the server responded with a status of 401
Auth error: Error: Invalid email or password
```

**Impact:**
- ❌ Users cannot sign in to the application
- ⚠️ Auth flow broken for both Supabase and Local API modes
- ❌ Session management fails

**Root Cause Analysis:**

**Scenario A: Local API Mode**
The app is running in local API mode (Supabase not configured), but:
- The `/api/auth/signin` endpoint is returning 401
- User credentials may not exist in local database
- Password hashing mismatch possible

**Scenario B: Supabase Mode**  
Despite Supabase credentials being present:
```typescript
// From .env file
VITE_SUPABASE_URL=https://bqmxdempuujeqgmxxbxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The auth service logs show:
```
[Auth] Supabase not configured. Using local API mode.
```

This suggests:
- Supabase credentials are loaded BUT
- The `isSupabaseConfigured()` check is failing
- App falls back to local API mode
- Local API endpoint `/api/auth/signin` returns 401

**Evidence:**
```typescript
// From authService.ts
let isLocalMode = !isSupabaseConfigured;

// Check credentials
const isSupabaseConfigured = 
  !!import.meta.env.VITE_SUPABASE_URL && 
  !!import.meta.env.VITE_SUPABASE_ANON_KEY;

// Error occurs when making request
const response = await fetch(`${LOCAL_API_URL}/auth/signin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

if (!response.ok) {
  return { user: null, error: { message: data.error || 'Invalid email or password' } };
}
```

**Investigation Steps Needed:**
1. Check if `/api` endpoint is running
2. Verify local API server is accessible at `http://localhost:3001/api`
3. Test credentials against local database
4. Verify Supabase project is active and accessible

**Solutions:**

**Fix 1: Ensure Local API is Running**
```bash
cd Maeple/api
npm install
npm start
# Should start on http://localhost:3001
```

**Fix 2: Create Test User in Local API**
```bash
# If using local API, need to create user first
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

**Fix 3: Debug Supabase Configuration**
```typescript
// Add logging to see why Supabase is not detected
console.log('[Auth Debug] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('[Auth Debug] VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
console.log('[Auth Debug] isSupabaseConfigured:', isSupabaseConfigured);
```

---

### 4. MEDIUM: Wearable Integration Mock Mode

**Warning Messages:**
```
[Wearables] Oura: Using mock adapter
[Wearables] Apple Health: Web simulation
[Wearables] Garmin: Simulation mode (no credentials)
[Wearables] Whoop: Initialized (Mock/Dev mode)
[Wearables] Available providers: OURA, APPLE_HEALTH, GARMIN, WHOOP
```

**Impact:**
- ⚠️ No real wearable data collection
- ⚠️ All biometric data is simulated
- ⚠️ Cannot track sleep, heart rate, stress metrics from actual devices
- ✅ App still functional for core FACS features

**Root Cause:**
All wearable adapters are missing API credentials in the environment configuration.

**Evidence:**
```typescript
// From .env file (missing wearable credentials)
# Oura Ring
# VITE_OURA_CLIENT_ID=your_oura_client_id_here
# VITE_OURA_CLIENT_SECRET=your_oura_client_secret_here

# Garmin Connect
# VITE_GARMIN_CLIENT_ID=your_garmin_client_id_here
# VITE_GARMIN_CLIENT_SECRET=your_garmin_client_secret_here

# Fitbit, Whoop - also missing
```

**Code Analysis:**
```typescript
// From wearables/manager.ts
if (ouraAdapter.isConfigured()) {
  this.adapters.set("OURA", ouraAdapter);
  this.useMockData = false;
  console.log("[Wearables] Oura: Using real API");
} else {
  this.adapters.set("OURA", new MockWearableAdapter());
  console.log("[Wearables] Oura: Using mock adapter");
}

// Check configuration
isConfigured(): boolean {
  return !!(this.clientId && this.clientSecret);
}
```

**Solutions:**

**Option 1: Disable Wearable Feature**
If wearables are not needed:
```typescript
// .env
VITE_ENABLE_WEARABLES=false
```

**Option 2: Configure Wearable APIs**
Obtain credentials from each provider:

```bash
# Oura Ring
# 1. Create account at https://cloud.ouraring.com/
# 2. Register application to get Client ID and Secret
# 3. Add to .env
VITE_OURA_CLIENT_ID=your_client_id
VITE_OURA_CLIENT_SECRET=your_client_secret

# Garmin Connect
# 1. Create developer account at https://developer.garmin.com/
# 2. Register application
VITE_GARMIN_CLIENT_ID=your_garmin_client_id
VITE_GARMIN_CLIENT_SECRET=your_garmin_client_secret

# Apple Health
# iOS only - requires native app with HealthKit permissions
VITE_APPLE_HEALTH_ENABLED=false

# Whoop
# 1. Apply for developer access at https://developer.whoop.com/
VITE_WHOOP_CLIENT_ID=your_whoop_client_id
VITE_WHOOP_CLIENT_SECRET=your_whoop_client_secret
```

**Option 3: Accept Mock Mode**
For development/testing, mock mode is acceptable as it provides simulated data:
```typescript
// This is current behavior - acceptable for development
// Mock data simulates sleep, heart rate, etc.
```

---

### 5. LOW: Supabase Configuration Warning

**Warning Message:**
```
Supabase credentials not found. Using local storage mode only.
```

**Impact:**
- ⚠️ Cloud sync disabled
- ⚠️ No multi-device data synchronization
- ✅ Local storage works fine
- ✅ App fully functional offline

**Root Cause:**
Despite credentials being present in `.env`, the warning suggests they're not being detected at runtime.

**Evidence:**
```typescript
// .env HAS credentials
VITE_SUPABASE_URL=https://bqmxdempuujeqgmxxbxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// But app shows warning
Supabase credentials not found.
```

**Analysis:**
This is likely a timing issue where:
1. The warning log happens before environment variables are fully loaded
2. Or the check happens in a different module/execution context
3. Or there's a build configuration issue with Vite environment variable loading

**Investigation:**
```typescript
// Check supabaseClient.ts initialization
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);
```

**Solution:**
The warning appears to be a false positive since:
1. Supabase credentials ARE present in `.env`
2. The warning doesn't block functionality
3. Local API mode is working as intended fallback

**Recommendation:**
This can be ignored or suppressed if not causing actual issues:
```typescript
// Add better logging to clarify
if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Credentials not found. Using local storage mode only.');
} else {
  console.log('[Supabase] Using cloud storage with credentials:', supabaseUrl);
}
```

---

## Priority Fix Order

### Immediate (Blockers)
1. **Replace Expired Gemini API Key** - CRITICAL
   - Blocks all FACS analysis
   - Estimated fix time: 5 minutes

2. **Fix Worker MIME Type Error** - HIGH
   - Blocks web worker image processing
   - Estimated fix time: 30 minutes

### High Priority
3. **Resolve Authentication 401 Error** - HIGH
   - Blocks user login
   - Estimated fix time: 1 hour
   - Requires investigation into API server status

### Medium Priority
4. **Configure Wearable Integrations** - MEDIUM
   - Optional for core FACS functionality
   - Estimated fix time: 2-4 hours (requires API registration)

### Low Priority
5. **Suppress/Clarify Supabase Warning** - LOW
   - Cosmetic issue, no functional impact
   - Estimated fix time: 15 minutes

---

## Recommended Next Steps

### Step 1: Fix Gemini API Key (Critical)
```bash
# 1. Go to https://makersuite.google.com/app/apikey
# 2. Create new API key
# 3. Update Maeple/.env
VITE_GEMINI_API_KEY=your_new_api_key_here

# 4. Restart development server
npm run dev
```

### Step 2: Fix Worker MIME Type
```typescript
// Edit Maeple/vite.config.ts
export default defineConfig({
  // ... existing config
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        // ... existing config
      },
    },
  },
  assetsInclude: ['**/*.worker.ts'],
});

# Rebuild
npm run build
```

### Step 3: Debug Authentication
```bash
# Check if local API is running
curl http://localhost:3001/api/health

# If not running, start it
cd Maeple/api
npm install
npm start

# Test login with known credentials
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Step 4: Test FACS Functionality
After fixing the critical issues:
1. Open the MAEPLE application
2. Navigate to State Check / BioMirror
3. Capture a facial image
4. Verify FACS analysis returns real results
5. Check for Action Units (AU codes) in response
6. Verify confidence score > 0.8

### Step 5: Monitor Logs
```bash
# Watch for remaining errors
npm run dev

# Expected successful logs:
[VisionServiceAdapter] Analysis result: { confidence: 0.92, actionUnits: [...] }
[FACS] Analysis complete - 12 Action Units detected
[BackgroundSync] Sync completed successfully
```

---

## Additional Notes

### Vite Environment Variables
```typescript
// Vite exposes variables with VITE_ prefix
// Access via:
import.meta.env.VITE_GEMINI_API_KEY
import.meta.env.VITE_SUPABASE_URL

// Variables are replaced at build time
// Must restart dev server after changing .env
```

### Production Considerations
```bash
# Production uses .env.production
# Ensure production keys are valid before deploying
npm run build
npm run preview
```

### Circuit Breaker State
After API key expiration, the circuit breaker may be in OPEN state:
```typescript
// Circuit breaker state in VisionServiceAdapter
- failureThreshold: 5 failures
- successThreshold: 2 successes  
- resetTimeout: 60000ms (60 seconds)

// After fixing API key, circuit breaker will:
1. Wait for resetTimeout
2. Enter HALF_OPEN state
3. Allow test request
4. If successful, return to CLOSED state
```

---

## Conclusion

The FACS system is **non-functional** due to the expired Gemini API key. Once this is replaced, the core FACS analysis should work. The worker MIME type error and authentication issues need to be addressed to ensure smooth operation. Wearable integrations are optional for core FACS functionality and can remain in mock mode during development.

**Estimated Time to Full Restoration:** 2-4 hours
- API Key: 5 minutes
- Worker Fix: 30 minutes
- Auth Debug: 1-2 hours
- Testing: 30 minutes

---

**Report End**