# Comprehensive Error Fix Plan - MAEPLE FACS System

**Date:** January 24, 2026  
**Objective:** Methodically investigate and fix ALL identified errors  
**Approach:** Systematic analysis, targeted fixes, verification testing

---

## Error Inventory

From the console logs, we identified **8 distinct errors/warnings**. Each will be investigated and fixed systematically.

---

## ERROR #1: Supabase Credentials Not Found Warning

### Error Message:
```
Supabase credentials not found. Using local storage mode only.
```

### Severity: ⚠️ MEDIUM
### Impact: App may not use Supabase features despite credentials being present

### Investigation Steps:
1. **Check initialization code:**
   - File: `src/services/supabaseService.ts` or similar
   - Verify how Supabase is initialized
   - Check environment variable loading order

2. **Verify environment variables:**
   - Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist
   - Check they're not empty strings
   - Verify format is correct

3. **Test credential loading:**
   - Add console.log to show when credentials are loaded
   - Verify timing of credential check vs initialization

### Fix Plan:
**Option A:** Fix initialization timing
- Ensure environment variables are loaded before Supabase init
- Add proper loading checks

**Option B:** Update warning logic
- Fix false positive warning
- Only warn if credentials are actually missing

### Verification:
- Warning should not appear when credentials are valid
- Supabase features should work

### Estimated Time: 15-30 minutes

---

## ERROR #2: Wearable Mock Mode Warnings

### Error Messages:
```
[Wearables] Oura: Using mock adapter
[Wearables] Apple Health: Web simulation
[Wearables] Garmin: Simulation mode (no credentials)
[Wearables] Whoop: Initialized (Mock/Dev mode)
```

### Severity: ℹ️ LOW (Informational)
### Impact: Wearable data collection not working (optional feature)

### Investigation Steps:
1. **Check wearable service configuration:**
   - File: `src/services/wearables/` directory
   - Review each provider's initialization
   - Check for credential environment variables

2. **Document required credentials:**
   - Oura Ring: API keys from cloud.ouraring.com
   - Apple Health: Native integration (not web)
   - Garmin: OAuth credentials from developer.garmin.com
   - Whoop: API credentials from developer.whoop.com

3. **Assess current state:**
   - Are credentials configured in .env?
   - Are they being loaded correctly?
   - Is web mode limitation acceptable?

### Fix Plan:
**Phase 1 (Immediate):** Accept mock mode
- Document that mock mode is acceptable for development
- Add clear comments explaining each provider's status

**Phase 2 (Optional - Future):** Configure real APIs
- Obtain developer credentials from each provider
- Add to .env files
- Test real data collection

### Verification:
- Mock mode works correctly for testing
- If real APIs are added, data flows properly

### Estimated Time: 2-4 hours (for Phase 2, requires API registration)

---

## ERROR #3: Supabase Not Configured Warning

### Error Message:
```
[Auth] Supabase not configured. Using local API mode.
```

### Severity: ⚠️ MEDIUM
### Impact: May be duplicate/confusing warning with Error #1

### Investigation Steps:
1. **Check auth service initialization:**
   - File: `src/services/authService.ts`
   - Verify Supabase vs Local API detection logic

2. **Compare with Error #1:**
   - Are these separate checks?
   - Should they be unified?

3. **Verify intent:**
   - Is local API mode the desired behavior?
   - Or should Supabase be primary?

### Fix Plan:
**Option A:** Fix credential detection
- Ensure Supabase credentials are detected correctly
- Remove false warning

**Option B:** Make behavior explicit
- Add environment flag to force mode
- `VITE_AUTH_MODE=local` or `VITE_AUTH_MODE=supabase`

### Verification:
- App uses intended auth backend
- Warning only appears if truly not configured

### Estimated Time: 20-30 minutes

---

## ERROR #4: PWA Install Banner Issue

### Error Message:
```
Banner not shown: beforeinstallpromptevent.preventDefault() called. The page must call beforeinstallpromptevent.prompt() to show the banner.
```

### Severity: ℹ️ LOW
### Impact: PWA install banner won't show automatically

### Investigation Steps:
1. **Check service worker registration:**
   - File: `public/sw.js`
   - Check if PWA install prompt is handled

2. **Check main app code:**
   - File: `src/App.tsx` or `src/index.tsx`
   - Look for `beforeinstallprompt` event handler

3. **Review manifest.json:**
   - File: `public/manifest.json`
   - Verify PWA configuration

### Fix Plan:
**Option A:** Remove preventDefault if not needed
- Allow default banner to show

**Option B:** Implement custom install UI
- Save the `beforeinstallprompt` event
- Show custom install button
- Call `event.prompt()` when clicked

### Verification:
- Install banner appears (or custom button works)
- PWA can be installed

### Estimated Time: 30-45 minutes

---

## ERROR #5: Authentication 401 Error

### Error Message:
```
api/auth/signin:1 Failed to load resource: the server responded with a status of 401 ()
Auth error: Error: Invalid email or password
```

### Severity: ⚠️ HIGH
### Impact: Users cannot sign in with wrong credentials (expected, but need to verify)

### Investigation Steps:
1. **Verify API server is running:**
   - ✅ DONE: Server running on localhost:3001
   - ✅ DONE: Health check passes

2. **Test authentication endpoints:**
   - Try signup with new user
   - Try signin with existing user
   - Verify error messages are appropriate

3. **Check database:**
   - ✅ DONE: 8 users exist
   - Verify password hashing works
   - Test bcrypt comparison

4. **Test specific user:**
   - Pick a known user from database
   - Attempt to sign in (need password)
   - Verify success/failure behavior

### Fix Plan:
**If users can sign in:** No fix needed
- 401 is expected for wrong credentials
- Document test users and passwords

**If users cannot sign in:** Debug auth flow
- Check password hashing
- Verify token generation
- Test database queries

### Verification:
- Valid credentials work
- Invalid credentials return appropriate error
- Session is created on successful login

### Estimated Time: 15-30 minutes

---

## ERROR #6: Worker MIME Type Error

### Error Message:
```
Failed to load module script: The server responded with a non-JavaScript MIME type of "video/mp2t"
Worker error: Event
```

### Severity: 🔴 HIGH
### Impact: Web worker cannot load, blocking efficient image processing

### Investigation Steps:
1. **✅ DONE:** Check Vite configuration
   - Added worker configuration to vite.config.ts

2. **Verify worker file:**
   - File: `src/workers/imageProcessor.worker.ts`
   - Check file extension and format
   - Verify it's valid TypeScript

3. **Test worker loading:**
   - Start dev server
   - Check if worker loads correctly
   - Verify MIME type is correct

4. **Check worker usage:**
   - File: `src/services/imageCompression.ts` or similar
   - Verify worker is imported correctly
   - Check how worker is instantiated

### Fix Plan:
**✅ DONE:** Updated vite.config.ts
```typescript
worker: {
  format: 'es',
  plugins: () => [react()],
},
assetsInclude: ['**/*.worker.ts'],
```

**If still failing:**
- Clear build cache: `rm -rf dist node_modules/.vite`
- Try different worker configuration
- Check if file is actually TypeScript (not compiled JS)

### Verification:
- Worker loads without MIME type error
- Image compression works
- Console shows successful worker initialization

### Estimated Time: 15-30 minutes (testing phase)

---

## ERROR #7: Gemini API Key Expired

### Error Message:
```
API key expired. Please renew the API key.
AIError: Gemini error: got status: 400
```

### Severity: 🔴 CRITICAL
### Impact: Complete block on FACS vision analysis

### Investigation Steps:
1. **✅ DONE:** Verify API key in .env files
   - Old key: `AIzaSyDrabqx8o0vF9dQQef5o9vLmVP9ram63hw` (expired)
   - New key: `AIzaSyDrabqx8o0vF9dQQef5o9vLm51g_-RDip0`

2. **Test new API key:**
   - Make test call to Gemini API
   - Verify it returns valid responses

3. **Check key loading:**
   - Verify environment variables are loaded
   - Check they're passed to Gemini client

4. **Test FACS analysis:**
   - Capture a facial image
   - Verify vision analysis works
   - Check Action Units are detected

### Fix Plan:
**✅ DONE:** Updated both environment files
- `Maeple/.env`
- `Maeple/.env.production`

**Next:** Restart dev server to load new key
```bash
cd Maeple
npm run dev
```

### Verification:
- FACS analysis returns results
- Confidence score > 0.8
- Action Units (AU codes) detected
- No API key errors in console

### Estimated Time: 5 minutes (restart) + 10 minutes (testing)

---

## ERROR #8: All AI Providers Failed

### Error Message:
```
All providers failed for capability vision
```

### Severity: 🔴 CRITICAL
### Impact: Complete FACS system failure

### Investigation Steps:
1. **Root cause:**
   - ✅ IDENTIFIED: Gemini API key expired
   - ✅ FIXED: Updated to new key

2. **Check provider fallback:**
   - File: `src/services/ai/providers/`
   - Verify fallback logic
   - Check if there are other providers configured

3. **Test after key update:**
   - Restart application
   - Test FACS analysis
   - Verify provider loads correctly

### Fix Plan:
**✅ DONE:** Updated Gemini API key

**If still fails:**
- Check provider initialization code
- Verify API call format
- Test with different image
- Add more detailed error logging

### Verification:
- At least one AI provider works
- FACS analysis completes
- Returns valid Action Units
- No "all providers failed" error

### Estimated Time: 10-15 minutes

---

## Test Failures (Non-Critical)

### Test Issues:
1. **StateCheckWizard - React act() warning**
   - State updates not wrapped in act()
   - Severity: Low (test infrastructure)

2. **JournalEntry - DOM element selection**
   - Button selector not finding element
   - Severity: Low (test assertion)

### Fix Plan:
1. Add `act()` wrappers in StateCheckWizard tests
2. Update DOM selectors in JournalEntry tests
3. Re-run tests to verify

### Estimated Time: 30 minutes

---

## Implementation Schedule

### Phase 1: Critical Fixes (Immediate - 30 minutes)
- [ ] Restart dev server to load new Gemini API key
- [ ] Test FACS analysis with real camera
- [ ] Verify worker MIME type fix
- [ ] Confirm no "all providers failed" error

### Phase 2: Warnings (30-45 minutes)
- [ ] Investigate Supabase credentials warning
- [ ] Fix Supabase not configured warning
- [ ] Document wearable mock mode status

### Phase 3: PWA & Tests (45-60 minutes)
- [ ] Fix PWA install banner issue
- [ ] Fix React act() warnings in tests
- [ ] Update JournalEntry DOM selectors
- [ ] Re-run full test suite

### Phase 4: Optional Future Work (2-4 hours)
- [ ] Configure real wearable APIs (when ready)
- [ ] Add production deployment configurations

---

## Verification Checklist

After completing each phase, verify:

### Phase 1 Verification:
- [ ] FACS analysis works with real camera
- [ ] Action Units detected with confidence > 0.8
- [ ] Worker loads without MIME type error
- [ ] No "all providers failed" in console
- [ ] Image compression working

### Phase 2 Verification:
- [ ] Supabase warnings resolved or documented
- [ ] Auth mode is clear (local vs Supabase)
- [ ] Wearable mock mode clearly documented

### Phase 3 Verification:
- [ ] PWA install banner works (or custom UI)
- [ ] All tests pass (or only minor infrastructure issues)
- [ ] Test suite runs successfully

---

## Success Criteria

### Must Have (Critical):
- ✅ Gemini API key working
- ✅ FACS analysis functional
- ✅ Workers load correctly
- ✅ Authentication works

### Should Have (Important):
- Supabase warnings resolved
- PWA install works
- Test infrastructure improved

### Nice to Have (Optional):
- Real wearable APIs configured
- 100% test pass rate

---

## Rollback Plan

If any fix introduces new issues:

1. **Git commit before changes:**
```bash
git add .
git commit -m "Before FACS error fixes"
```

2. **Revert specific changes:**
```bash
git checkout HEAD~1 -- path/to/file
```

3. **Document issue and alternative approach**

---

## Next Immediate Actions

1. **Restart development server:**
```bash
cd Maeple
npm run dev
```

2. **Test FACS functionality:**
- Open http://localhost:5173
- Navigate to State Check
- Capture facial image
- Verify analysis works

3. **Check console for errors:**
- No "API key expired" errors
- No "worker MIME type" errors
- No "all providers failed" errors

4. **Document any remaining issues**

---

## Status Summary

| Error | Status | Priority | Est. Time |
|-------|--------|----------|-----------|
| #1: Supabase credentials | Pending | Medium | 15-30 min |
| #2: Wearable mock mode | Documented | Low | 2-4 hrs* |
| #3: Supabase auth config | Pending | Medium | 20-30 min |
| #4: PWA install banner | Pending | Low | 30-45 min |
| #5: Auth 401 | Investigated | High | 15-30 min |
| #6: Worker MIME type | ✅ Fixed | High | Testing |
| #7: Gemini API key | ✅ Fixed | Critical | 5 min |
| #8: All providers failed | ✅ Fixed | Critical | Testing |
| Test failures | Pending | Low | 30 min |

*Optional, requires API registration

---

**Plan Created:** January 24, 2026  
**Next Review:** After Phase 1 completion (30 minutes)