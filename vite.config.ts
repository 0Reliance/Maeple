import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose process.env for compatibility with existing code
    'process.env.API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY)
  },
  build: {
    // Optimize build for production
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split chunks for better caching
        manualChunks: {
          // Vendor chunk for third-party libraries
          vendor: ['react', 'react-dom'],
          // AI service chunk
          ai: ['./services/ai'],
          // Heavy components chunk
          components: [
            './components/LiveCoach',
            './components/VisionBoard',
            './components/StateCheckWizard',
            './components/Settings',
            './components/ClinicalReport'
          ]
        }
      }
    },
    // Optimize chunk size warning threshold
    chunkSizeWarningLimit: 600
  },
  optimizeDeps: {
    // Pre-bundle dependencies for better performance
    include: [
      'react',
      'react-dom',
      'lucide-react',
      '@google/genai',
      'idb'
    ]
  },
  resolve: {
    // Path aliases for cleaner imports
    alias: {
      '@': resolve(__dirname, './'),
      '@components': resolve(__dirname, './components'),
      '@services': resolve(__dirname, './services')
    }
  }
})
