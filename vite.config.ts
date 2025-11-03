import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks(id) {
          // Vendor chunk - core dependencies
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'charts'; // Lazy-loaded with admin, will be a separate chunk
            }
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            // Other node_modules
            return 'vendor-libs';
          }

          // Admin components - lazy loaded
          if (id.includes('/components/admin/')) {
            return 'admin';
          }

          // Modal components - lazy loaded
          if (id.includes('Modal.tsx')) {
            return 'modals';
          }
        }
      }
    }
  }
});