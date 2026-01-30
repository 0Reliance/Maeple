# Authentication Troubleshooting Guide

**Issue**: Authentication broken after .env changes

## Root Cause

The `.env` file had a formatting error where two environment variables were merged:
```
VITE_DEFAULT_THEME=systemMAIL_DRIVER=smtp
```

This caused VITE_DEFAULT_THEME to be loaded as `systemMAIL_DRIVER=smtp` instead of `system`.

## What Was Fixed

✅ **Fixed formatting** - Added proper newline between variables:
```env
VITE_DEFAULT_THEME=system

MAIL_DRIVER=smtp
```

✅ **Server restarted** - Vite detected .env change and restarted automatically

## Next Steps to Fix Authentication

### Step 1: Clear All Browser Data

Open http://localhost:5173, press F12, go to Console, and run:

```javascript
// Clear ALL MAEPLE storage
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('maeple')) {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  }
});

Object.keys(sessionStorage).forEach(key => {
  if (key.startsWith('maeple')) {
    sessionStorage.removeItem(key);
    console.log('Removed:', key);
  }
});

console.log('✅ All MAEPLE storage cleared');
console.log('Reloading page in 2 seconds...');

setTimeout(() => location.reload(), 2000);
```

### Step 2: Verify Environment Variables

After reload, check in console:

```javascript
// Check environment variables
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
console.log('GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? 'Present' : 'Missing');
console.log('APP_NAME:', import.meta.env.VITE_APP_NAME);
```

Expected output:
```
SUPABASE_URL: https://bqmxdempuujeqgmxxbxw.supabase.co
SUPABASE_ANON_KEY: Present
GEMINI_API_KEY: Present
APP_NAME: Maeple
```

### Step 3: Check Auth Service

Run in console:

```javascript
// Check auth state
if (window.authService) {
  console.log('Auth state:', window.authService.getAuthState());
  console.log('User:', window.authService.getUser());
} else {
  console.warn('authService not found');
}
```

### Step 4: Check Supabase Client

Run in console:

```javascript
// Check if Supabase is initialized
if (window.supabase) {
  console.log('✅ Supabase client initialized');
  console.log('Supabase URL:', window.supabase.supabaseUrl);
} else {
  console.warn('⚠️ Supabase client not found');
}
```

### Step 5: Test Connection

Run in console:

```javascript
// Test Supabase connection
if (window.supabase) {
  window.supabase.auth.getSession()
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Session error:', error);
      } else {
        console.log('✅ Session check successful');
        console.log('Session data:', data);
      }
    });
}
```

## Common Issues & Solutions

### Issue 1: "Invalid API key" for Supabase

**Cause**: Environment variable not loaded correctly

**Solution**:
1. Verify `.env` file format (one variable per line)
2. Ensure no spaces around `=` sign
3. Check file is named `.env` (not `.env.example`)
4. Restart development server:
   ```bash
   # Stop server (Ctrl+C)
   cd Maeple
   npm run dev
   ```

### Issue 2: Auth state not updating

**Cause**: Browser cached old auth state

**Solution**:
```javascript
// Force clear auth state
localStorage.removeItem('maeple_auth_session');
localStorage.removeItem('maeple_auth_user');
sessionStorage.clear();
location.reload();
```

### Issue 3: Can't sign in

**Cause**: Supabase connection failed

**Solution**:
1. Check Supabase dashboard: https://supabase.com/dashboard
2. Verify project is active
3. Check email auth is enabled
4. Verify user exists in database

### Issue 4: CORS errors

**Cause**: Browser blocking requests

**Solution**:
1. Check network tab for CORS errors
2. Verify Supabase URL is correct
3. Ensure running in development mode
4. Try incognito window

## Verification Checklist

After clearing cache and reloading, verify:

- [ ] Page loads without console errors
- [ ] Environment variables loaded correctly
- [ ] Supabase client initialized
- [ ] Auth state is accessible
- [ ] Can sign in/sign out
- [ ] Auth persists across page reloads
- [ ] FACS analysis works (if API key valid)

## Current .env Configuration

```env
# AI Providers
VITE_GEMINI_API_KEY=AIzaSyDrabqx8o0vF9dQQef5o9vLm51g_-RDip0

# Feature Flags
VITE_ENABLE_BIOMIRROR=true
VITE_ENABLE_VOICE_JOURNAL=true
VITE_ENABLE_WEARABLES=true
VITE_ENABLE_CLOUD_SYNC=true
VITE_ENABLE_OFFLINE_MODE=true

# Supabase Authentication
VITE_SUPABASE_URL=https://bqmxdempuujeqgmxxbxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxbXhkZW1wdXVqZXFnbXh4Ynh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4ODExMzcsImV4cCI6MjA4MjQ1NzEzN30.8U0HLSDqSETOglvs0VjhZaL0MPqqYVWRxBdlgmNfvog

# Other Settings
VITE_APP_NAME=Maeple
VITE_APP_ENV=development
VITE_DEFAULT_THEME=system
```

## Emergency Recovery

If authentication still broken after all steps:

### Option 1: Hard Reset
```bash
cd Maeple
rm -rf node_modules/.vite
npm run dev
```

### Option 2: Restore Backup
```bash
cd Maeple
cp .env.backup.20260120_221241 .env
npm run dev
```

### Option 3: Create Fresh .env
```bash
cd Maeple
cp .env.example .env
# Edit .env with correct values
npm run dev
```

## Support

If issues persist:

1. Check browser console for specific errors
2. Check network tab for failed requests
3. Review Supabase dashboard for project status
4. Verify all environment variables in .env are correct format

**Status**: ✅ Formatting error fixed, server restarted, ready for testing