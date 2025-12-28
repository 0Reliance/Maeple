import type { CapacitorConfig } from '@capacitor/config';

const config: CapacitorConfig = {
  appId: 'com.pozimind.maeple',
  appName: 'Maeple',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // Prevent caching issues in mobile WebView
    androidScheme: 'https',
    cleartext: true,
    // Add headers to prevent caching
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  // Enable live reload for development
  // For production, this is automatically disabled
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;