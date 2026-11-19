import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          dexie: ['dexie', 'dexie-react-hooks'],
          scanner: ['zxing-wasm', 'pako']
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 3000,
    host: true
  }
});
