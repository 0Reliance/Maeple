# Caching Solution for MAEPLE

## Problem
Users were not seeing the most recent version of the app on mobile devices due to aggressive browser and WebView caching.

## Solution Implemented

### 1. Service Worker Improvements (`public/sw.js`)
- **Dynamic Versioning**: Service worker now uses a timestamp-based cache version instead of hardcoded version
- **Network-First Strategy**: HTML and critical assets always fetch from network first, then cache
- **Automatic Cache Cleanup**: Old caches are automatically deleted when new version activates
- **Immediate Activation**: Uses `skipWaiting()` to activate new service workers immediately

### 2. Build Configuration (`vite.config.ts`)
- **Cache Busting**: All assets now include content-based hashes in filenames (e.g., `index-DDvUfgsp.js`)
- **Version Injection**: Build timestamp is injected as `__BUILD_VERSION__` constant
- **Custom Plugin**: Service worker is copied to dist with version comment for tracking

### 3. Mobile Configuration (`capacitor.config.ts`)
- **Cache-Control Headers**: Added headers to prevent WebView caching
  - `Cache-Control: no-cache, no-store, must-revalidate`
  - `Pragma: no-cache`
  - `Expires: 0`
- **HTTPS Scheme**: Uses HTTPS scheme for better caching control
- **Cleartext Support**: Enabled for development environments

### 4. HTML Meta Tags (`index.html`)
- Added cache-control meta tags to prevent browser caching at the HTML level
- Versioned manifest URL to trigger updates

### 5. Service Worker Registration (`src/swRegistration.ts`)
- **Auto-Update**: Automatically checks for updates on registration
- **Old Worker Cleanup**: Unregisters old service workers before registering new ones
- **Force Reload**: Methods to force reload with timestamp to bypass any residual caching

## How to Deploy Updates

### For Web Deployment
```bash
# Build the application
npm run build

# Deploy the dist/ folder to your hosting provider
# The new build will automatically cache-bust due to hashed filenames
```

### For Mobile Deployment

#### Quick Sync (Recommended)
```bash
# Use the provided script for both build and sync
./scripts/sync-mobile-build.sh

# Or manually:
npm run build
npx cap sync android
npx cap sync ios
```

#### Note on Node.js Version
Capacitor CLI requires Node.js >= 22.0.0. If you're on an older version:
```bash
# Check current version
node --version

# Update using nvm (recommended)
nvm install 22
nvm use 22

# Then run sync again
npm run build
npx cap sync
```

## Testing on Mobile Devices

### After Deploying a New Build

1. **Force Reload the App**
   - **Android**: Settings > Apps > MAEPLE > Storage > Clear Data (or Uninstall/Reinstall)
   - **iOS**: Delete and reinstall the app

2. **Check Service Worker Version**
   - Open Chrome DevTools on the device (if available)
   - Check Console for log: `[SW] Service worker registered successfully, version: <timestamp>`

3. **Verify Network Requests**
   - Check Network tab to see fresh requests (status 200) with new asset hashes
   - Cached requests will show status 200 (from service worker) but with proper revalidation

## Troubleshooting

### "Still seeing old version"
1. **Clear All Caches**:
   ```javascript
   // In browser console
   caches.keys().then(cacheNames => {
     return Promise.all(
       cacheNames.map(cacheName => caches.delete(cacheName))
     );
   });
   ```

2. **Unregister Service Workers**:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(registration => registration.unregister());
   });
   ```

3. **Force Reload**:
   ```javascript
   // Reload with cache-busting parameter
   window.location.href = window.location.pathname + '?_=' + Date.now();
   ```

### Service Worker Not Updating
- Check browser console for errors
- Verify service worker file is being served (check Network tab)
- Ensure `__BUILD_VERSION__` is properly defined (check console logs)

## Monitoring

### Service Worker Lifecycle
The service worker logs key events:
- Installation with version number
- Activation events
- Cache cleanup operations
- Background sync triggers

### Asset Versioning
Each build generates unique hashes:
- `dist/assets/index-DDvUfgsp.js` - Main bundle
- `dist/assets/index-CwVYu39-.css` - Styles
- `dist/sw.js` - Service worker (version in comments)

## Best Practices

1. **Always build before syncing to mobile**
2. **Use the provided sync script** for consistency
3. **Test on both platforms** (web, Android, iOS)
4. **Monitor service worker logs** during development
5. **Keep Node.js updated** for Capacitor CLI compatibility

## Additional Notes

- The cache-busting solution works for both PWA and mobile deployments
- Service worker updates are automatic but require page reload to activate
- Mobile WebView caching is controlled via Capacitor configuration
- All caches use version-based naming to prevent conflicts