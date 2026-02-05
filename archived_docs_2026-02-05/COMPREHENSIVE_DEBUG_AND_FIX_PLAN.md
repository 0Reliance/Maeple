# Comprehensive Debug & Fix Plan - FACS Errors Persist

**Date:** January 24, 2026  
**Status:** CRITICAL - Fixes Not Working As Expected  
**Approach:** Step Back → Investigate → Research → Root Cause Analysis → Execute Fixes

---

## Problem Statement

Despite applying fixes to source code, errors PERSIST in both:
- Local dev server (localhost:5173)
- Production site (maeple.0reliance.com)

## Current Errors (Still Active)

### Error #1: Worker MIME Type (PERSISTING)
```
Failed to load module script: The server responded with a non-JavaScript MIME type of "video/mp2t"
Worker error: Event
```
**Severity:** 🔴 HIGH
**Impact:** Web workers cannot load, blocking efficient image processing

### Error #2: Gemini API Key Expired (PERSISTING)
```
AIError: Gemini error: got status: 400 . {"error":{"code":400,"message":"API key expired. Please renew the API key.","status":"INVALID_ARGUMENT"}}
```
**Severity:** 🔴 CRITICAL
**Impact:** Complete block on all FACS vision analysis

---

## Investigation Plan - Phase 1: Root Cause Analysis

### Step 1.1: Verify Environment Variables Are Being Loaded
**Objective:** Confirm new API key is actually being used

**Actions:**
```bash
# Check what the dev server sees
cd Maeple
grep VITE_GEMINI_API_KEY .env
grep VITE_GEMINI_API_KEY .env.production

# Verify file contents are correct
cat .env | grep -A 2 VITE_GEMINI_API_KEY
```

**Expected:** Should see new key `AIzaSyDrabqx8o0vF9dQQef5o9vLm51g_-RDip0`  
**Actual:** Need to verify

---

### Step 1.2: Check Vite Configuration
**Objective:** Verify worker configuration is actually being used

**Actions:**
```bash
# Verify vite.config.ts changes
cd Maeple
grep -A 5 "worker:" vite.config.ts
grep -A 2 "assetsInclude:" vite.config.ts
```

**Expected:** Should see worker config section  
**Actual:** Need to verify

---

### Step 1.3: Check Build Artifacts
**Objective:** Verify new code is in the built output

**Actions:**
```bash
# Check built worker file
ls -lh dist/assets/*worker*

# Check when files were last built
ls -lt dist/assets/ | head -20

# Search for old API key in built files
grep -r "AIzaSyDrabqx8o0vF9dQQef5o9vLmVP9ram63hw" dist/
```

**Expected:** Should NOT find old key, should find new key  
**Actual:** Need to verify

---

### Step 1.4: Clear All Caches
**Objective:** Eliminate cache as a factor

**Actions:**
```bash
# Stop dev server
pkill -f "npm run dev"
pkill -f "vite"

# Clear Vite cache
cd Maeple
rm -rf node_modules/.vite
rm -rf dist

# Clear browser cache (instruction to user)
# Clear Node modules cache
rm -rf node_modules/.cache
```

---

## Investigation Plan - Phase 2: Deep Code Analysis

### Step 2.1: Trace API Key Loading Path
**Objective:** Follow how API key flows through the system

**Files to examine:**
1. `src/services/geminiVisionService.ts` - `getApiKey()` function
2. `src/services/ai/router.ts` - AI router initialization
3. `src/services/ai/index.ts` - Settings service
4. `.env` - Environment file
5. `.env.production` - Production environment file

**Code paths to trace:**
```
.env → import.meta.env.VITE_GEMINI_API_KEY → 
getApiKey() → getAI() → GoogleGenAI() → 
API calls
```

**Questions to answer:**
- Is the key being read at all?
- Is it being read from the right file?
- Is there another .env file overriding it?
- Is there build-time vs runtime confusion?

---

### Step 2.2: Trace Worker Loading Path
**Objective:** Follow how workers are instantiated

**Files to examine:**
1. `src/services/imageWorkerManager.ts` - Worker creation
2. `src/workers/imageProcessor.worker.ts` - Worker implementation
3. `vite.config.ts` - Worker configuration
4. Built file: `dist/assets/imageProcessor.worker-CIlRsE8L.ts`

**Code paths to trace:**
```
Worker creation → Vite bundler → vite.config.ts worker section → 
MIME type → Browser loading
```

**Questions to answer:**
- Is the worker config being applied by Vite?
- Is the worker being bundled correctly?
- Why is it getting MIME type "video/mp2t"?
- Is there a Content-Type header issue?

---

### Step 2.3: Check for Multiple .env Files
**Objective:** Ensure we're editing the right environment file

**Actions:**
```bash
cd Maeple
find . -name ".env*" -type f 2>/dev/null
```

**Expected:** Should only see `.env`, `.env.example`, `.env.production`  
**Potential Issue:** There might be another `.env` file we're not editing

---

### Step 2.4: Verify Server Restart
**Objective:** Ensure dev server is actually running new code

**Actions:**
```bash
# Check if dev server is running
ps aux | grep "npm run dev"

# Check if vite is running
ps aux | grep vite

# Check port 5173
lsof -i :5173 || netstat -tulpn | grep 5173

# Kill all
pkill -f "vite"
pkill -f "npm"

# Wait and restart fresh
sleep 2
npm run dev
```

---

## Research Needed

### Research 1: Vite Worker MIME Type Issue
**Objective:** Understand why workers get wrong MIME type

**Search terms:**
- "Vite worker MIME type video/mp2t"
- "Vite worker configuration format es"
- "Failed to load module script non-JavaScript MIME type"

**Resources to check:**
- Vite documentation on workers
- Vite GitHub issues
- StackOverflow for similar problems

**Potential solutions to research:**
1. Different worker format options
2. Alternative worker bundling strategies
3. Custom MIME type headers
4. Using Vite plugins for workers

---

### Research 2: Environment Variable Loading in Vite
**Objective:** Understand why env vars might not load

**Search terms:**
- "Vite import.meta.env not loading"
- "Vite environment variables not working in dev"
- "Vite .env file not being read"

**Resources to check:**
- Vite documentation on environment variables
- Vite mode (development vs production)
- Environment variable scoping rules

**Potential solutions to research:**
1. VITE_ prefix requirements
2. Client vs server env vars
3. .env.local vs .env
4. Build vs runtime loading

---

### Research 3: Browser MIME Type Enforcement
**Objective:** Understand browser behavior with workers

**Search terms:**
- "Failed to load module script non-JavaScript MIME type"
- "Browser worker MIME type checking"
- "Strict MIME type checking enforced module scripts"

**Resources to check:**
- MDN Web Workers documentation
- Chrome/Firefox MIME type policies
- CORS and worker loading

**Potential solutions:**
1. Different worker instantiation methods
2. Bypassing MIME type checks
3. Using blob URLs instead
4. Service worker fallback

---

## Comprehensive Fix Plan

### Fix Attempt #1: Complete Cache & Restart
**Priority:** CRITICAL  
**Estimated Time:** 5 minutes

**Steps:**
1. Kill all running processes
2. Clear all caches
3. Verify .env files have correct keys
4. Rebuild from scratch
5. Start fresh dev server
6. Clear browser cache (Ctrl+Shift+Delete)
7. Test FACS

**Commands:**
```bash
cd Maeple

# 1. Kill all processes
pkill -9 -f "npm run dev"
pkill -9 -f vite
pkill -9 -f node

# 2. Clear all caches
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist

# 3. Verify .env files
echo "=== .env ===" && cat .env | grep VITE_GEMINI_API_KEY
echo "=== .env.production ===" && cat .env.production | grep VITE_GEMINI_API_KEY

# 4. Clean rebuild
npm run build

# 5. Start fresh
npm run dev
```

**Success Criteria:**
- New API key visible in console logs
- Worker loads without MIME type error
- FACS analysis completes successfully

---

### Fix Attempt #2: Alternative Worker Configuration
**Priority:** HIGH  
**Estimated Time:** 15 minutes

**If Fix #1 fails, try:**

**Option A: Different Vite worker config**
```typescript
// In vite.config.ts
worker: {
  format: 'es',
  plugins: () => [react()],
  rollupOptions: {
    output: {
      format: 'es'
    }
  }
},
```

**Option B: Use inline workers**
```typescript
// Instead of external worker file
const workerCode = await import('./workers/imageProcessor.worker.ts');
const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(workerBlob);
const worker = new Worker(workerUrl);
```

**Option C: Disable workers temporarily**
```typescript
// Fallback to main thread if worker fails
try {
  // Use worker
} catch (error) {
  console.warn('Worker failed, using main thread');
  // Process on main thread
}
```

---

### Fix Attempt #3: Direct API Key Injection
**Priority:** CRITICAL  
**Estimated Time:** 10 minutes

**If API key still not loading:**

**Option A: Hard-code for testing (TEMPORARY)**
```typescript
// In geminiVisionService.ts
const getApiKey = (): string | null => {
  // TEMPORARY: Hard-code to verify it works
  const hardcodedKey = "AIzaSyDrabqx8o0vF9dQQef5o9vLm51g_-RDip0";
  console.log("[GeminiVision] Using key:", hardcodedKey.substring(0, 20) + "...");
  return hardcodedKey;
  
  // Original code for later
  // const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  // ...
};
```

**Option B: Debug environment loading**
```typescript
const getApiKey = (): string | null => {
  console.log("[GeminiVision] import.meta.env:", import.meta.env);
  console.log("[GeminiVision] All env keys:", Object.keys(import.meta.env));
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log("[GeminiVision] API Key from env:", envKey ? "Found" : "NOT FOUND");
  console.log("[GeminiVision] API Key length:", envKey?.length || 0);
  
  if (!envKey) {
    console.error("[GeminiVision] API KEY IS MISSING!");
    return null;
  }
  return envKey;
};
```

**Option C: Check for .env.local override**
```bash
# Check if .env.local exists and overrides .env
cat Maeple/.env.local 2>/dev/null || echo "No .env.local file"

# If exists, update it too
if [ -f Maeple/.env.local ]; then
  echo "Updating .env.local with new API key"
  echo "VITE_GEMINI_API_KEY=AIzaSyDrabqx8o0vF9dQQef5o9vLm51g_-RDip0" >> Maeple/.env.local
fi
```

---

### Fix Attempt #4: Verify Production Deployment
**Priority:** HIGH  
**Estimated Time:** 15 minutes

**For production site (maeple.0reliance.com):**

**Steps:**
1. Check how production is deployed
2. Verify environment variables in production
3. Redeploy with new build
4. Clear CDN cache if applicable
5. Force browser refresh

**Questions to answer:**
- Is it Vercel? Netlify? Custom server?
- Where are production env vars set?
- Is there a build pipeline we need to run?
- Does production need .env.production vs .env?

---

## Execution Order

### Phase 1: Immediate Diagnostics (5 minutes)
1. ✅ Kill all processes
2. ✅ Clear all caches
3. ✅ Verify .env file contents
4. ✅ Check for multiple .env files

### Phase 2: Debug Logging (10 minutes)
1. ✅ Add console.log to trace API key loading
2. ✅ Add console.log to trace worker initialization
3. ✅ Rebuild and restart
4. ✅ Check console for debug output

### Phase 3: Apply Fixes Based on Diagnostics
- **If API key not loading:** Try Fix Attempt #3
- **If worker MIME type wrong:** Try Fix Attempt #2
- **If both:** Try all fixes systematically

### Phase 4: Production Deployment (if needed)
1. ✅ Deploy new build
2. ✅ Verify production env vars
3. ✅ Clear CDN cache
4. ✅ Test production site

---

## Success Criteria

### Must Achieve:
1. ✅ No "API key expired" error in console
2. ✅ No "worker MIME type" error in console
3. ✅ FACS analysis returns Action Units
4. ✅ Confidence score > 0.8
5. ✅ Image compression works

### Should Achieve:
1. ✅ Clear understanding of root cause
2. ✅ Production site working
3. ✅ Documentation of fixes applied

---

## Next Actions (Immediate)

1. **Execute Phase 1 Diagnostics**
   - Kill processes
   - Clear caches
   - Verify files

2. **Execute Phase 2 Debug Logging**
   - Add tracing
   - Observe console output

3. **Apply appropriate fixes**
   - Based on diagnostic results
   - Test each fix

4. **Document everything**
   - What worked
   - What didn't
   - Root cause analysis

---

**Plan Created:** January 24, 2026  
**Status:** Ready to Execute  
**Next Step:** Execute Phase 1 Diagnostics