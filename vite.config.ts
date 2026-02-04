import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";
import path from "path";

// Generate cache busting version based on timestamp
const CACHE_VERSION = `${Date.now()}`;

// Custom plugin to copy service worker with version
function copyServiceWorker() {
  return {
    name: 'copy-service-worker',
    writeBundle() {
      const swPath = path.resolve(__dirname, 'public/sw.js');
      const distPath = path.resolve(__dirname, 'dist/sw.js');
      
      // Copy service worker with version parameter in comments
      let swContent = fs.readFileSync(swPath, 'utf-8');
      swContent = `// Generated at: ${new Date().toISOString()}\n// Version: ${CACHE_VERSION}\n` + swContent;
      fs.writeFileSync(distPath, swContent);
      console.log(`[Build] Service worker copied with version: ${CACHE_VERSION}`);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react({
      // Ensure worker files are processed
      include: /\.(worker|ts|tsx|js|jsx)$/,
    }),
    copyServiceWorker()
  ],
  worker: {
    format: 'es',
    plugins: [react()],
  },
  define: {
    // Expose cache version for service worker
    "__BUILD_VERSION__": JSON.stringify(CACHE_VERSION),
  },
  build: {
    // Optimize build for production
    target: "es2020",
    minify: "terser",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better code splitting
        manualChunks: (id) => {
          // React and React DOM go together - core dependency
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          
          // React-dependent charting libraries go with react to avoid initialization issues
          if (id.includes('node_modules/recharts') || 
              id.includes('node_modules/react-smooth') ||
              id.includes('node_modules/react-transition-group')) {
            return 'charts-vendor';
          }
          
          // Split UI libraries
          if (id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }
          
          // Split AI libraries
          if (id.includes('node_modules/@google/genai')) {
            return 'ai-vendor';
          }
          
          // Split IndexedDB
          if (id.includes('node_modules/idb')) {
            return 'db-vendor';
          }
          
          // D3 libraries (used by recharts but don't need React)
          if (id.includes('node_modules/d3-')) {
            return 'd3-vendor';
          }
          
          // Split other vendor libraries
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
          
          // Keep app code in main bundle
          return undefined;
        },
        // Add cache busting to asset filenames
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
    },
    // Optimize chunk size warning threshold
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    // Pre-bundle dependencies for better performance
    include: ["react", "react-dom", "lucide-react", "@google/genai", "idb"],
  },
  resolve: {
    // Path aliases for cleaner imports
    alias: {
      "@": resolve(__dirname, "./src"),
      "@components": resolve(__dirname, "./src/components"),
      "@services": resolve(__dirname, "./src/services"),
      "@utils": resolve(__dirname, "./src/utils"),
      "@stores": resolve(__dirname, "./src/stores"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@workers": resolve(__dirname, "./src/workers"),
    },
  },
});