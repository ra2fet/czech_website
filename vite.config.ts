import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // This ensures assets and src paths work correctly when deployed in a subdirectory
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
