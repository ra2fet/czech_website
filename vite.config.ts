import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Changed to absolute path for proper SPA routing
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
