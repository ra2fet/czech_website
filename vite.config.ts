import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Changed to relative path for proper file:// protocol support
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increased limit to 1000kB
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'react-hot-toast', 'react-toastify', 'react-datepicker'],
          'vendor-charts': ['chart.js', 'react-chartjs-2', 'apexcharts', 'react-apexcharts'],
          'vendor-utils': ['axios', 'date-fns', 'i18next', 'react-i18next'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});
