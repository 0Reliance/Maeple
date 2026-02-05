# FACS Error Analysis and Fixes
**Date:** 2026-01-29
**Status:** Analysis Complete, Fixes Required

## Executive Summary

Two critical errors are preventing FACS (Facial Action Coding System) functionality:
1. **Gemini API Key Expired** - Blocks all vision analysis
2. **Worker MIME Type Error** - Blocks image processing worker initialization

## Detailed Error Analysis

### 1. CRITICAL: Gemini API Key Expired

**Error Log:**
```
generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent:1 
Failed to load resource: the server responded with a status of 400 ()

AIError: Gemini error: got status: 400 . 
{"error":{"code":400,"message":"API key expired. Please renew the API key.",...}}
```

**Root Cause:**
- The Gemini API key in `.env` has expired
- API key: `AIzaSyDrabqx8o0vF9dQQef5o9vLm51g_-RDip0`

**Impact:**
- ✅ Camera capture works (1702.63 KB → 15.57 KB compressed)
- ✅ Image compression works (99% reduction)
- ❌ **ALL vision analysis fails** - Bio-Mirror, FACS detection, emotional analysis
- ❌ Live Coach functionality broken
- ❌ StateCheckWizard cannot process images

**Fix Required:**
1. Go to Google AI Studio: https://makersuite.google.com/app/apikey
2. Locate the API key `AIzaSyDrabqx8o0vF9dQQef5o9vLm51g_-RDip0`
3. Renew or regenerate the API key
4. Update `Maeple/.env`:
   ```bash
   VITE_GEMINI_API_KEY=<new_api_key_here>
   ```
5. Restart the development server

---

### 2. CRITICAL: Worker MIME Type Error

**Error Log:**
```
assets/imageProcessor.worker-CIlRsE8L.ts:1 
Failed to load module script: The server responded with a non-JavaScript MIME type of "video/mp2t". 
Strict MIME type checking is enforced for module scripts per HTML spec.

[ImageWorkerManager] Worker error: Event
```

**Root Cause:**
- The worker file `imageProcessor.worker-CIlRsE8L.ts` has a `.ts` extension
- Nginx (or the web server) is serving `.ts` files as `video/mp2t` (MPEG transport stream)
- Browser rejects the worker because it expects `application/javascript`

**Why This Happens:**
- Vite builds TypeScript workers but keeps `.ts` extension in output
- Nginx `deploy/nginx.conf` doesn't have MIME type configuration for `.ts` files
- Default MIME type mapping for `.ts` is `video/mp2t` on some systems

**Impact:**
- ✅ Main thread captures and compresses images
- ❌ **Worker initialization fails completely**
- ❌ Image processing operations fail
- ❌ Edge detection (if used) fails
- ❌ Any worker-dependent operations are broken

**Fix Options:**

#### Option A: Configure Nginx MIME Types (Recommended)

Update `deploy/nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript 
                text/xml application/xml application/xml+rss text/javascript
                application/typescript;

    # ADD: Explicit MIME types for worker files
    location ~ \.ts$ {
        default_type application/javascript;
        add_header Content-Type application/javascript;
    }

    location ~ \.worker\.ts$ {
        default_type application/javascript;
        add_header Content-Type application/javascript;
    }

    # API Proxy
    location /api {
        proxy_pass http://api:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA Routing (handle client-side routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, no-transform";
        
        # ADD: Ensure worker files have correct MIME type
        location ~ \.worker\.ts$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
            add_header Content-Type application/javascript;
        }
    }
}
```

#### Option B: Rename Worker Files in Build

Update `vite.config.ts` to output workers as `.js`:
```typescript
build: {
    rollupOptions: {
        output: {
            // ... existing config
            assetFileNames: (assetInfo) => {
                // Rename .worker.ts files to .worker.js
                if (assetInfo.name?.endsWith('.worker.ts')) {
                    return `assets/${assetInfo.name.replace('.ts', '.js')}`;
                }
                return `assets/[name]-[hash].[ext]`;
            },
        },
    },
}
```

**Current Configuration Issue:**
- Vite config has `worker: { format: 'es', plugins: () => [react()] }`
- `assetsInclude: ['**/*.worker.ts']` tells Vite to treat them as assets
- But output keeps `.ts` extension, causing MIME type issues

---

### 3. EXPECTED: Supabase Authentication 403

**Error Log:**
```
api/auth/me:1 Failed to load resource: the server responded with a status of 403 ()
```

**Analysis:**
- This is **expected behavior** based on configuration
- Supabase is intentionally disabled in `.env`:
  ```bash
  # Disabled to use local API for development
  # VITE_SUPABASE_URL=https://bqmxdempuujeqgmxxbxw.supabase.co
  # VITE_SUPABASE_ANON_KEY=...
  ```
- Application logs confirm: `[Auth] Supabase not configured. Using local API mode.`
- Not a functional issue - local API mode is working as designed

**Action Required:** None (working as intended)

---

### 4. INFO: PWA Installation Banner

**Message:**
```
Banner not shown: beforeinstallpromptevent.preventDefault() called. 
The page must call beforeinstallpromptevent.prompt() to show the banner.
```

**Analysis:**
- This is an informational message about PWA (Progressive Web App)
- Application is suppressing automatic install prompt
- Standard behavior for PWA-controlled installation flow
- Not an error

**Action Required:** None

---

## Priority Fix Order

### 🔴 IMMEDIATE (Blocks Core Functionality)

1. **Renew Gemini API Key** (Priority 1)
   - Time to fix: 5-10 minutes
   - Impact: Restores all vision analysis
   
2. **Fix Worker MIME Type** (Priority 1)
   - Time to fix: 10-15 minutes
   - Impact: Restores worker-based image processing

### 🟡 HIGH (Improves Stability)

3. **Update Nginx Configuration** (Priority 2)
   - Time to fix: 5 minutes
   - Impact: Prevents future MIME type issues

---

## Implementation Steps

### Step 1: Renew Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Locate existing key or create new one
3. Copy new API key
4. Update `Maeple/.env`:
   ```bash
   VITE_GEMINI_API_KEY=<your_new_api_key>
   ```
5. Restart development server:
   ```bash
   cd Maeple
   npm run dev
   ```

### Step 2: Fix Worker MIME Type (Choose One)

#### If Using Docker/Production:

1. Update `deploy/nginx.conf` with Option A configuration
2. Rebuild and redeploy:
   ```bash
   cd Maeple/deploy
   docker-compose down
   docker-compose up --build -d
   ```

#### If Using Local Development:

The issue may not occur in local dev (Vite dev server handles MIME types correctly). This is primarily a production deployment issue.

### Step 3: Verify Fixes

1. Test camera capture:
   - Open StateCheckWizard
   - Capture an image
   - Verify no worker errors

2. Test vision analysis:
   - Capture image
   - Check for Gemini API response
   - Verify FACS analysis completes

3. Check console:
   - No worker MIME type errors
   - No Gemini API errors
   - Supabase 403 is acceptable (local API mode)

---

## Technical Deep Dive: Worker MIME Type Issue

### Why .ts Files Get Wrong MIME Type

Default MIME type mappings vary by system:

| Extension | Standard MIME | Some Systems | Issue |
|-----------|--------------|--------------|-------|
| `.js` | `application/javascript` | `application/javascript` | ✅ Correct |
| `.mjs` | `application/javascript` | `application/javascript` | ✅ Correct |
| `.ts` | `video/mp2t` | `video/mp2t` | ❌ Wrong |
| `.tsx` | `video/mp2t` | `video/mp2t` | ❌ Wrong |

The `.ts` extension conflicts with MPEG Transport Stream (`.ts`) files used in video streaming.

### Vite's Worker Build Process

1. Source: `src/workers/imageProcessor.worker.ts`
2. Vite processes with `worker.format = 'es'` and `worker.plugins = [react()]`
3. Transpiled but keeps `.ts` extension in output: `assets/imageProcessor.worker-CIlRsE8L.ts`
4. Nginx serves with default MIME type: `video/mp2t`
5. Browser rejects: "Strict MIME type checking enforced"

### Why It Works in Development

Vite dev server has built-in MIME type handling:
- Correctly serves `.ts` files as `application/javascript`
- Override system default MIME types
- Only affects production deployments

---

## Alternative Solutions

### Solution 1: Vite Worker Plugin (Cleanest)

Install `vite-plugin-worker`:
```bash
npm install -D vite-plugin-worker
```

Update `vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import worker from 'vite-plugin-worker';

export default defineConfig({
  plugins: [
    react(),
    copyServiceWorker(),
    worker(),
  ],
  // ... rest of config
});
```

This automatically:
- Renames `.worker.ts` to `.worker.js` in output
- Handles worker imports correctly
- No MIME type issues

### Solution 2: Inline Worker Code

For small workers, inline the code in the main file:
```typescript
// In your component
const workerCode = `
  // Worker code here
`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));
```

Pros: No external file, no MIME type issues
Cons: Harder to debug, larger bundle size

---

## Testing Checklist

After applying fixes, verify:

- [ ] Camera initializes without errors
- [ ] Image capture succeeds (check compression ratio)
- [ ] Worker loads successfully (no MIME type errors)
- [ ] Vision analysis completes with Gemini API
- [ ] FACS results display correctly
- [ ] StateCheckWizard end-to-end flow works
- [ ] No console errors related to workers or Gemini
- [ ] Bio-Mirror functionality restored

---

## Monitoring and Prevention

### Preventing Future API Key Expiration

1. Set up API key expiration alerts
2. Document key renewal process
3. Consider using key rotation strategy
4. Store keys securely (not in repo)

### Preventing Worker MIME Issues

1. Always test production builds locally
2. Use Vite worker plugin for consistency
3. Configure nginx MIME types explicitly
4. Add MIME type checks to CI/CD

---

## References

- Google AI Studio: https://makersuite.google.com/app/apikey
- Vite Workers: https://vitejs.dev/guide/features.html#web-workers
- Nginx MIME Types: http://nginx.org/en/docs/http/ngx_http_core_module.html#types
- MIME Type Database: https://www.iana.org/assignments/media-types/media-types.xhtml

---

## Conclusion

Both critical errors have clear, straightforward fixes:

1. **Gemini API Key**: Renew in Google AI Studio (5-10 minutes)
2. **Worker MIME Type**: Update nginx config or use Vite worker plugin (10-15 minutes)

After these fixes, FACS functionality should be fully restored.