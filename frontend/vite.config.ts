import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries - ~150KB
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // React Query for API state management - ~50KB
          'query-vendor': ['@tanstack/react-query'],
          
          // Chart library - ~500KB (biggest chunk)
          'charts': ['react-apexcharts', 'apexcharts'],
          
          // Icon libraries - ~30KB
          'icons': ['@heroicons/react'],
        },
      },
    },
    // Increase warning limit since we're intentionally creating larger chunks
    chunkSizeWarningLimit: 1000,
    
    // Enable gzip size reporting to track improvements
    reportCompressedSize: true,
  },
})
