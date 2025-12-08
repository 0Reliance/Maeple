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
        // Improved chunk splitting for better caching
        manualChunks(id) {
          // React and core libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
          // Lucide icons are heavy - put in separate chunk
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // Google AI library
          if (id.includes('@google/genai')) {
            return 'ai-sdk';
          }
          // IndexedDB library
          if (id.includes('node_modules/idb')) {
            return 'storage';
          }
          // Charting library (if used)
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts';
          }
          // AI services - separate chunk
          if (id.includes('services/ai') || id.includes('services/gemini')) {
            return 'ai-services';
          }
          // Heavy components - individual chunks for lazy loading
          if (id.includes('components/LiveCoach')) {
            return 'feature-coach';
          }
          if (id.includes('components/VisionBoard')) {
            return 'feature-vision';
          }
          if (id.includes('components/StateCheckWizard') || id.includes('components/StateCheck')) {
            return 'feature-statecheck';
          }
          if (id.includes('components/Settings') || id.includes('components/AIProvider')) {
            return 'feature-settings';
          }
          if (id.includes('components/ClinicalReport')) {
            return 'feature-clinical';
          }
          if (id.includes('components/HealthMetricsDashboard') || id.includes('components/Analysis')) {
            return 'feature-dashboard';
          }
          // Core services
          if (id.includes('services/') && !id.includes('node_modules')) {
            return 'services';
          }
          // Other components
          if (id.includes('components/') && !id.includes('node_modules')) {
            return 'components';
          }
        }
      }
    },
    // Optimize chunk size warning threshold
    chunkSizeWarningLimit: 500
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
