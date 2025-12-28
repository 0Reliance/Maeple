# Bio-Mirror Troubleshooting Guide

**Date:** December 27, 2025  
**Status:** Updated with Enhanced Error Handling

---

## Issue: Bio-Mirror Not Responding After Taking Photo

### Symptoms
- Camera opens and captures photo successfully
- After capture, nothing happens (stuck on "Analyzing" screen)
- No error message displayed
- No analysis results shown

---

## Potential Causes & Solutions

### 1. Trial/Subscription Issue

**Cause:** Bio-Mirror requires an active trial or premium subscription.

**Symptoms:**
- FeatureGate blocks the component
- Shows upgrade modal instead of camera

**Solution:**    
```javascript
// In browser console, start trial manually:
useSubscriptionStore.getState().startTrial();
```

**UI Fix:**
- Added "Start Your 7-Day Free Trial" button to intro screen
- Click the button to activate trial
- Then try Bio-Mirror again

---

### 2. AI API Key Missing

**Cause:** `VITE_GEMINI_API_KEY` or configured AI provider key is not set.

**Symptoms:**
- Camera captures photo
- Progress bar shows briefly then stops
- Analysis doesn't complete

**Check Console:**
```javascript
// Look for these messages:
"Gemini API Key not found. Vision features will be limited."
"Analysis failed. Please check your AI API key in Settings."
```

**Solution:**
1. Go to Settings → AI Provider
2. Configure an API key (Z.ai, Gemini, or other provider)
3. Save settings
4. Try Bio-Mirror again

**Debug Commands:**
```javascript
// Check current provider
console.log(useAIProviderStore.getState().currentProvider);

// Check if API key exists
console.log(localStorage.getItem('aiProviderSettings'));
```

---

### 3. AI Service Timeout

**Cause:** AI service takes longer than 30 seconds to respond.

**Symptoms:**
- "Analyzing" screen shows for >30 seconds
- New error message: "Analysis timed out after 30 seconds"

**Solution:**
- Click "Try Again" to retry
- Check internet connection
- Try different AI provider in Settings

**Enhanced Error Display:**
```typescript
// Now shows detailed error message in UI
{
  error: "Analysis timed out after 30 seconds...",
  errorDetails: "Error: AI analysis timeout after 30 seconds",
  actions: ["Try Again", "Cancel"]
}
```

---

### 4. Network/CORS Issues

**Cause:** Browser blocks AI API requests due to CORS or network restrictions.

**Symptoms:**
- Network errors in console
- 403/404/500 errors
- "Failed to fetch" errors

**Check Console:**
```javascript
// Look for network errors:
FetchError: request to https://... failed
CORS policy: No 'Access-Control-Allow-Origin' header
```

**Solution:**
1. Check browser console network tab for CORS errors
2. Try different AI provider (some have better CORS support)
3. Disable browser extensions that block requests
4. Try in incognito/private mode

---

### 5. Image Processing Failure

**Cause:** Image compression or preprocessing fails.

**Symptoms:**
- Camera captures photo
- Console shows "Image size: XX KB"
- Then error: "Failed to capture image"

**Check Console:**
```javascript
// Look for these messages:
"Original image size: 123.45 KB"
"Compressed image size: 45.67 KB (63% reduction)"
// Then:
"Capture error: ..."
```

**Solution:**
- Check if image compression utilities are loaded
- Verify browser supports WebP format
- Try taking a simpler photo (better lighting)

---

### 6. FeatureGate Blocking

**Cause:** FeatureGate wraps StateCheckWizard and may be blocking it.

**Symptoms:**
- Camera never opens
- Shows "Premium Feature" or "Trial Ended" overlay

**Solution:**
```javascript
// Check trial status in console:
const store = useSubscriptionStore.getState();
console.log({
  isTrialActive: store.isTrialActive,
  isSubscribed: store.isSubscribed,
  hasTrialExpired: store.hasTrialExpired,
  daysRemaining: store.daysRemaining
});

// If not active, start trial:
store.startTrial();
```

---

## Debugging Checklist

### Step 1: Check Console Logs

Open browser developer console (F12) and look for Bio-Mirror logs:

```javascript
// Expected logs when working correctly:
🔍 [Bio-Mirror] Starting image capture...
📸 [Bio-Mirror] Image captured, size: 123456 characters
🤖 [Bio-Mirror] Starting AI analysis...
⏳ [Bio-Mirror] Progress: Preprocessing image (5%)
⏳ [Bio-Mirror] Progress: Checking cache (10%)
⏳ [Bio-Mirror] Progress: Connecting to AI (15%)
⏳ [Bio-Mirror] Progress: Analyzing facial features (50%)
⏳ [Bio-Mirror] Progress: Processing response (80%)
⏳ [Bio-Mirror] Progress: Validating results (85%)
✅ [Bio-Mirror] Analysis complete: { ... }
```

### Step 2: Check AI Provider

```javascript
// Check which AI provider is configured
const aiStore = useAIProviderStore?.getState();
console.log('AI Provider:', aiStore?.currentProvider);
console.log('API Key exists:', !!aiStore?.settings?.apiKey);
```

### Step 3: Check Trial Status

```javascript
// Check trial/subscription status
const subStore = useSubscriptionStore.getState();
console.log('Trial Active:', subStore.isTrialActive);
console.log('Subscribed:', subStore.isSubscribed);
console.log('Days Remaining:', subStore.daysRemaining);
```

### Step 4: Test API Directly

```javascript
// Test if API key works
import { getAI } from './src/services/geminiVisionService';
const ai = getAI();
console.log('AI initialized:', !!ai);

// If null, API key is missing or invalid
```

---

## Common Error Messages

### "Analysis failed. Please check your AI API key in Settings and try again."

**Meaning:** AI service rejected the request or returned error.

**Debug:**
```javascript
// Check detailed error in new UI
// See "Error Details" section for full error message
```

**Solution:**
1. Go to Settings → AI Provider
2. Verify API key is correct
3. Try different provider
4. Check if provider account has quota

---

### "Analysis timed out after 30 seconds"

**Meaning:** AI service took too long to respond.

**Solution:**
1. Check internet connection
2. Try different AI provider
3. Click "Try Again" to retry
4. Check if AI provider is experiencing outages

---

### "Camera permission denied"

**Meaning:** Browser blocked camera access.

**Solution:**
1. Click camera icon in browser address bar
2. Allow camera access
3. Refresh page
4. Try again

---

### "No camera found"

**Meaning:** Device has no working camera.

**Solution:**
1. Check if camera works in other apps
2. Ensure camera is not in use by another app
3. Try on a different device
4. Use device with built-in camera

---

## Enhanced Error Handling (Added)

### Error State UI

When analysis fails, users now see:

```
┌─────────────────────────────────────┐
│     ⚠️  Analysis Failed          │
│                                 │
│ Analysis timed out after 30        │
│ seconds. The AI service may be    │
│ slow or unavailable.             │
│                                 │
│ Error Details:                    │
│ AI analysis timeout after 30       │
│ seconds                         │
│                                 │
│ [Try Again]    [Cancel]          │
└─────────────────────────────────────┘
```

### Trial Activation UI

If trial not started, users see:

```
┌─────────────────────────────────────┐
│ Start Your 7-Day Free Trial      │
│ to unlock Bio-Mirror analysis.    │
│                                 │
│ [Start Free Trial]                │
└─────────────────────────────────────┘
```

---

## Next Steps for Users

### If Issue Persists

1. **Clear Browser Cache**
   - Open DevTools (F12)
   - Go to Application tab
   - Clear storage for localhost
   - Refresh page

2. **Try Incognito/Private Mode**
   - Opens without extensions
   - Tests if extension is blocking

3. **Check Network**
   - Ensure stable internet connection
   - Check if VPN is interfering
   - Test on different network

4. **Try Different Browser**
   - Chrome, Firefox, Safari
   - Tests for browser-specific issues

5. **Contact Support**
   - Export console logs
   - Screenshot error message
   - Describe what happened

---

## Console Commands for Debugging

```javascript
// Check all stores
console.log('--- Subscription Store ---');
console.log(useSubscriptionStore.getState());

console.log('--- AI Provider Store ---');
console.log(useAIProviderStore?.getState());

console.log('--- App Store ---');
console.log(useAppStore?.getState());

// Check storage
console.log('--- IndexedDB ---');
const request = indexedDB.open('maeple_db', 2);
request.onsuccess = (e) => {
  const db = (e.target as IDBOpenDBRequest).result;
  console.log('Stores:', Array.from(db.objectStoreNames));
};

// Clear subscription store
useSubscriptionStore.getState().reset();

// Reset trial
useSubscriptionStore.getState().startTrial();

// Manually trigger trial check
useSubscriptionStore.getState().checkTrialStatus();
```

---

## Known Issues

### Issue 1: Z.ai Provider Timeout

**Status:** Known, investigating

**Symptoms:**
- Takes >30 seconds to analyze
- Often times out

**Workaround:**
- Switch to Gemini provider in Settings
- Or click "Try Again" multiple times

---

### Issue 2: FeatureGate Blocks Without Clear Reason

**Status:** Fixed - added trial activation button

**Previous Behavior:**
- FeatureGate would block silently
- No clear way to start trial

**Fix:**
- Added "Start Your 7-Day Free Trial" button
- Shows trial status on intro screen

---

## Implementation Notes

### Changes Made (December 27, 2025)

1. **Enhanced Error Handling**
   - Added ERROR state to StateCheckWizard
   - Added error details display
   - Added Try Again / Cancel buttons

2. **Better Logging**
   - Added emoji-based console logs
   - Progress tracking at each step
   - Detailed error messages

3. **Trial Activation**
   - Added "Start Free Trial" button
   - Shows trial status conditionally
   - Auto-trial when feature first accessed

4. **Subscription Status Display**
   - Shows trial status in intro
   - Tips for when to use Bio-Mirror
   - Clear messaging about premium features

---

## Resources

### Related Files

- `src/components/StateCheckWizard.tsx` - Main wizard component
- `src/components/StateCheckCamera.tsx` - Camera capture
- `src/components/FeatureGate.tsx` - Feature gating
- `src/services/geminiVisionService.ts` - AI analysis
- `src/stores/subscriptionStore.ts` - Trial/subscription state

### Documentation

- `docs/FACS_AND_AI_OPTIMIZATION_PLAN.md` - FACS implementation
- `docs/BIOMIRROR_TYPEERROR_FIXES.md` - Previous fixes
- `docs/FACS_IMPLEMENTATION_VERIFICATION.md` - Verification
- `docs/FACS_DEPLOYMENT_READY.md` - Deployment status

---

## Support

If issues persist after trying all solutions:

1. **Collect Information:**
   - Browser and version
   - Console logs (screenshot or copy)
   - Network tab screenshot (if network errors)
   - Steps to reproduce

2. **Report Issue:**
   - GitHub Issues (if available)
   - Internal issue tracker
   - Contact support team

3. **Workaround:**
   - Use alternative features (Journaling, Dashboard)
   - Access Bio-Mirror on different device
   - Wait for fix and try again

---

**Last Updated:** December 27, 2025  
**Version:** 1.0
