#!/bin/bash

# Script to sync the latest build to mobile platforms
# This ensures mobile apps always serve the latest version

set -e

echo "🔄 Syncing latest build to mobile platforms..."

# Build the web app
echo "📦 Building web app..."
npm run build

# Sync to Android
if [ -d "android" ]; then
    echo "🤖 Syncing to Android..."
    npx cap sync android
    echo "✅ Android synced successfully"
else
    echo "⚠️  Android directory not found, skipping..."
fi

# Sync to iOS
if [ -d "ios" ]; then
    echo "🍎 Syncing to iOS..."
    npx cap sync ios
    echo "✅ iOS synced successfully"
else
    echo "⚠️  iOS directory not found, skipping..."
fi

echo ""
echo "✨ Build sync complete!"
echo ""
echo "To test on mobile:"
echo "  Android: npx cap open android"
echo "  iOS:     npx cap open ios"
echo ""
echo "📝 Remember to:"
echo "  1. Clear app data (Android) or reinstall app to clear cache"
echo "  2. Force close and reopen the app"
echo "  3. Check browser console for service worker version logs"