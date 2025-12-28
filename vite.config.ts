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
    react(),
    copyServiceWorker()
  ],
  define: {
    // Expose process.env for compatibility with existing code
    "process.env.API_KEY": JSON.stringify(process.env.VITE_GEMINI_API_KEY),
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
        // Let Vite handle chunk splitting automatically to avoid initialization errors
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
      "@": resolve(__dirname, "./"),
      "@components": resolve(__dirname, "./components"),
      "@services": resolve(__dirname, "./services"),
    },
  },
});