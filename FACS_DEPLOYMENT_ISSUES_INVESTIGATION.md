# FACS Deployment Issues Investigation Report
**Date**: 2026-02-01  
**Status**: Critical Issues Identified  
**Environment**: Production (port 80)

## Executive Summary

The FACS system deployed to production at port 80 is experiencing multiple critical failures that prevent core functionality. The primary issues are:

1. **Worker MIME Type Configuration Failure** - Blocking image processing
2. **Expired Gemini API Key** - Preventing AI vision analysis
3. **Missing Runtime Environment Variables** - Disabling Supabase integration

## Critical Issues Analysis

### 1. Worker MIME Type Configuration (BLOCKING)

**Error Message**:
```
Failed to load module script: The server responded with a non-JavaScript MIME type of "video/mp2t". 
Strict MIME type checking is enforced for module scripts per HTML spec.

File: assets/imageProcessor.worker-CIlRsE8L.ts
```

**Root Cause**:
- Vite builds worker files with hash-based naming: `imageProcessor.worker-[hash].ts`
- nginx configuration expects `.ts` or `.worker.ts` patterns
- The actual filename `imageProcessor.worker-CIlRsE8L.ts` contains a hash between `.worker` and `.ts`
- nginx doesn't match this pattern, so it defaults to `video/mp2t` (MPEG transport stream)
- Browser rejects the worker script due to MIME type mismatch

**Impact**: 
- Image compression worker fails to initialize
- FACS system cannot process captured images
- Core functionality completely broken

**Configuration Analysis**:

Current nginx.conf:
```nginx
location ~ \.ts$ {
    default_type application/javascript;
}

location ~ \.worker\.ts$ {
    default_type application/javascript;
}
```

Problem: The pattern `\.worker\.ts$` doesn't match `imageProcessor.worker-CIlRsE8L.ts` because the hash is inserted between `.worker` and `.ts`.

### 2. Expired Gemini API Key (BLOCKING)

**Error Message**:
```
API key expired. Please renew the API key.
Status: 400 INVALID_ARGUMENT
```

**Old Key**: `AIzaSyD-Nlpagwd3uwpMKC4_dPleUw1_l9HmCuQ` (EXPIRED)
**New Key**: `AIzaSyAL9RaeI3nCs4hoRYkhCn1U18cqbQ2dRMc` (ACTIVE)

**Root Cause**:
- The Google Gemini API key has expired
- Google API keys have expiration dates for security
- The key in `.env.production` was generated on or before 2024 (based on JWT timestamp `1766881137` = 2025-12-25)

**Impact**:
- All AI vision analysis fails
- Facial expression recognition disabled
- BioMirror core AI features non-functional

### 3. Missing Runtime Environment Variables (DEGRADED)

**Error Message**:
```
Supabase credentials not found. Using local storage mode only.
Auth] Supabase not configured. Using local API mode.
```

**Root Cause**:
- Environment variables defined in `.env.production` are build-time only
- Vite's `VITE_*` variables are inlined during build
- At runtime, the application cannot access these variables
- The worker and other runtime code need access to API keys

**Impact**:
- No database connectivity
- No user authentication
- No data persistence
- App falls back to local storage only

## Technical Details

### Worker Implementation

**File**: `src/workers/imageProcessor.ts`
- Uses Vite's `?worker` import syntax
- Exported as ES module worker
- Contains image processing logic (resize, edge detection, compression)

**File**: `src/services/imageWorkerManager.ts`
- Dynamically imports worker: `import('../workers/imageProcessor?worker')`
- Manages worker lifecycle and communication
- Provides promise-based API for image processing

### Build Configuration

**Vite Config** (`vite.config.ts`):
```typescript
worker: {
  format: 'es',
  plugins: [react()],
}
```

**Output Pattern**: Vite hashes worker files as `imageProcessor.worker-[hash].ts`

### Deployment Architecture

**Dockerfile.web**:
1. Build stage: Runs `npm run build`
2. Copies `.env.production` (but only build-time vars)
3. Production stage: Serves with nginx

**nginx Configuration**:
- Port 80
- Proxy to API at `/api`
- Static asset serving at `/assets`
- MIME type rules (incorrect)

## Remediation Plan

### Priority 1: Fix Worker MIME Type (CRITICAL)

**Solution**: Update nginx.conf to match Vite's worker naming pattern

```nginx
# Match Vite's worker file naming: *.worker-[hash].ts
location ~ \.worker-.*\.ts$ {
    default_type application/javascript;
    add_header Content-Type application/javascript;
    add_header Cache-Control "public, no-transform";
}

# Also catch all .ts files
location ~ \.ts$ {
    default_type application/javascript;
    add_header Content-Type application/javascript;
}

# Ensure .js files also have correct MIME type
location ~ \.js$ {
    default_type application/javascript;
    add_header Content-Type application/javascript;
}
```

**Implementation Steps**:
1. Update `deploy/nginx.conf` with corrected MIME type rules
2. Rebuild Docker image
3. Redeploy to production
4. Verify worker loads correctly in browser console

### Priority 2: Renew Gemini API Key (CRITICAL)

**Solution**: Generate new valid API key

**Steps**:
1. Access Google AI Studio (https://aistudio.google.com/app/apikey)
2. Create new API key for Gemini 2.5 Flash
3. Update `.env.production`:
   ```
   VITE_GEMINI_API_KEY=<new_key>
   VITE_GOOGLE_API_KEY=<new_key>
   ```
4. Rebuild and redeploy
5. Test vision analysis

**Alternative**: Use environment variable at runtime instead of build-time

### Priority 3: Fix Runtime Environment Variables (HIGH)

**Solution**: Provide API keys at runtime

**Option A**: Use a runtime configuration file
1. Create `public/config.js` that reads from environment
2. Load config before app initialization
3. Docker provides env vars at runtime

**Option B**: Use nginx to inject configuration
1. Add template in index.html
2. nginx substitutes values from environment
3. More secure than build-time inlining

**Option C**: Use a backend API endpoint
1. Create `/api/config` endpoint
2. Backend reads from environment variables
3. Frontend fetches config on startup

**Recommended**: Option A (simplest, minimal changes)

### Priority 4: Add Error Handling & Fallbacks (MEDIUM)

**Solution**: Graceful degradation

**Implement**:
1. Worker initialization fallback (main thread processing if worker fails)
2. API key rotation mechanism (multiple keys with auto-failover)
3. Clear error messages for users
4. Health check dashboard for monitoring

## Testing & Verification

### Pre-Deployment Testing
1. Build locally: `npm run build`
2. Test worker loading in browser DevTools
3. Verify MIME type for all assets
4. Test image capture and processing
5. Test AI vision analysis
6. Verify database connectivity

### Post-Deployment Verification
1. Check browser console for errors
2. Test complete FACS workflow
3. Monitor API key usage and quotas
4. Verify Supabase connection
5. Test user authentication flow

## Monitoring Recommendations

1. **Add logging** for:
   - Worker initialization success/failure
   - API key validation errors
   - Environment variable access
   - MIME type issues

2. **Health checks**:
   - Worker readiness endpoint
   - API key validity check
   - Database connectivity test

3. **Alerts**:
   - Worker initialization failures
   - API key expiration warnings
   - MIME type errors

## Risk Assessment

| Issue | Severity | Likelihood | Impact | Risk Level |
|-------|----------|------------|--------|------------|
| Worker MIME Type | Critical | High | Complete system failure | **HIGH** |
| Expired API Key | Critical | High | No AI functionality | **HIGH** |
| Runtime Env Vars | High | Medium | Degraded features | **MEDIUM** |

## Dependencies

- nginx configuration
- Vite build process
- Google AI API
- Supabase
- Docker deployment

## Timeline Estimate

- Priority 1 (Worker MIME): 1-2 hours
- Priority 2 (API Key): 30 minutes
- Priority 3 (Runtime Config): 2-3 hours
- Priority 4 (Error Handling): 4-6 hours
- Testing & Verification: 2-3 hours

**Total**: 1-2 days for complete resolution

## Conclusion

The FACS system deployment issues are primarily configuration problems rather than code defects. The fixes are straightforward but require immediate attention as they completely block core functionality. Once these issues are resolved, the system should work correctly in production.

## Next Steps

1. Implement Priority 1 fix (nginx MIME type)
2. Generate new Gemini API key
3. Implement runtime configuration solution
4. Add error handling and monitoring
5. Perform comprehensive testing
6. Deploy and verify

---

**Report Generated**: 2026-02-01  
**Investigated By**: Cline AI  
**Status**: Ready for Implementation