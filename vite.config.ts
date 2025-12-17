import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

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
  plugins: [react()],
  define: {
    // Expose process.env for compatibility with existing code
    "process.env.API_KEY": JSON.stringify(process.env.VITE_GEMINI_API_KEY),
  },
  build: {
    // Optimize build for production
    target: "es2020",
    minify: "terser",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Let Vite handle chunk splitting automatically to avoid initialization errors
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
