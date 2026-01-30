# Clear Cached API Data - Instructions

**Purpose**: Clear any cached expired API key data so the new key is used

## Why This Is Needed

The MAEPLE app caches API keys in:
1. **localStorage**: `maeple_ai_settings` (encrypted)
2. **localStorage**: `maeple_ai_key_gemini` (encrypted)
3. **sessionStorage**: `maeple_ai_key_gemini` (fallback)

Since we updated the API key in `.env`, we need to clear these caches.

## How to Clear Cached Data

### Option 1: Browser DevTools (Recommended)

1. Open http://localhost:5173 in browser
2. Press F12 to open DevTools
3. Go to **Application** tab
4. In left sidebar, expand **Local Storage**
5. Click on `http://localhost:5173`
6. Look for and delete these keys:
   - `maeple_ai_settings`
   - `maeple_ai_key_gemini` (if exists)
7. In left sidebar, expand **Session Storage**
8. Click on `http://localhost:5173`
9. Look for and delete:
   - `maeple_ai_key_gemini` (if exists)
10. Refresh the page (F5)

### Option 2: Browser Console Script

1. Open http://localhost:5173 in browser
2. Press F12 to open DevTools
3. Go to **Console** tab
4. Run this command:

```javascript
// Clear all MAEPLE-related storage
localStorage.removeItem('maeple_ai_settings');
localStorage.removeItem('maeple_ai_key_gemini');
sessionStorage.removeItem('maeple_ai_key_gemini');

// Confirm cleared
console.log('✅ Cached API data cleared');
console.log('Refreshing page to use new API key...');

// Refresh page
setTimeout(() => location.reload(), 1000);
```

## After Clearing Cache

1. Page will automatically reload
2. Check console for initialization logs
3. Look for these SUCCESS markers:

```
[App] ===== APP INITIALIZATION START =====
[AI] ===== INITIALIZE AI SERVICES START =====
[AISettings] ✓ Found API key in environment
[AIRouter] ✓ Successfully initialized gemini adapter
[AI] ✓ Router available: true
[App] Running AI health check...
[App] AI Health check results: { gemini: true }
[App] Healthy providers: 1/1
[App] ✓ AI services are operational
[App] ===== APP INITIALIZATION COMPLETE =====
```

4. If you see `✓ AI services are operational`, the new key is working!

## Verification

After clearing cache and reloading, test the FACS system:

1. Navigate to `/bio-mirror`
2. Click "Capture State Check"
3. Allow camera access
4. Take a photo
5. Wait for analysis

**Expected results:**
- Progress shows "Connecting to Gemini API"
- Network tab shows POST to `generativelanguage.googleapis.com`
- Status code: **200 OK** (not 400!)
- Response contains `actionUnits` array with data
- UI displays:
  - Emotion (e.g., "Genuine Smile")
  - Confidence score (e.g., 0.87)
  - Action Units (e.g., AU6, AU12, AU24)
  - Interpretation (e.g., "Duchenne smile detected")

## Troubleshooting

### Still Getting "API key expired" error?

1. Double-check the new key:
   ```javascript
   // Run in console:
   console.log(import.meta.env.VITE_GEMINI_API_KEY);
   ```
   Should show: `AIzaSyDrabqx8o0vF9dQQef5o9vLm51g_-RDip0`

2. Verify key format:
   - Must start with `AIza` ✅
   - Must be 39 characters ✅

3. Check .env file:
   - File must be named `.env` (not `.env.example`)
   - File must be in `Maeple` directory
   - No extra spaces around `=` sign

4. Restart server:
   ```bash
   # Stop server (Ctrl+C)
   cd Maeple
   npm run dev
   ```

### Health Check Still Fails?

If health check still returns 400, the new API key might be invalid or expired.

**Solution**: Get another fresh API key from https://aistudio.google.com/app/apikey

## Summary

**What was done:**
1. ✅ Updated .env file with new API key
2. ✅ Vite automatically restarted server
3. ⏳ Need to clear cached data (user action)
4. ⏳ Verify new key works (user action)

**Next steps:**
1. Clear localStorage/sessionStorage (use console script above)
2. Reload page
3. Check console for "✓ AI services are operational"
4. Test FACS analysis at /bio-mirror

**Expected outcome:**
- Health check passes: `{ gemini: true }`
- FACS analysis works with real results
- No more "API key expired" errors